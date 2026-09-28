<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function register(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name'       => 'required|string|max:100',
            'brand_name' => 'nullable|string|max:100',
            'username'   => 'required|string|max:40|unique:users,username|regex:/^[a-zA-Z0-9_\-]+$/',
            'email'      => 'required|email|max:150|unique:users,email',
            'password'   => 'required|string|min:6',
            'phone'      => 'nullable|string|max:25',
            'city'       => 'nullable|string|max:100',
        ], [
            'username.regex'  => 'Username hanya boleh berisi huruf, angka, garis bawah (_), atau strip (-).',
            'username.unique' => 'Username ini sudah digunakan oleh fotografer lain.',
            'email.unique'    => 'Email ini sudah terdaftar.',
            'password.min'    => 'Password minimal 6 karakter.',
        ]);

        $user = User::create([
            'name'       => $validated['name'],
            'brand_name' => $validated['brand_name'] ?: ($validated['name'] . ' Photography'),
            'username'   => strtolower($validated['username']),
            'email'      => strtolower($validated['email']),
            'password'   => Hash::make($validated['password']),
            'phone'      => $validated['phone'] ?? null,
            'whatsapp'   => $validated['phone'] ?? null,
            'city'       => $validated['city'] ?? null,
        ]);

        $token = $user->createToken('fotografer-device')->plainTextToken;

        return response()->json([
            'token'   => $token,
            'user'    => $user->only([
                'id', 'name', 'brand_name', 'username', 'email',
                'phone', 'avatar_path', 'city',
            ]),
            'message' => 'Registrasi fotografer berhasil.',
        ], 201);
    }

    public function login(Request $request): JsonResponse
    {
        $request->validate([
            'email'    => 'required|email',
            'password' => 'required|string',
        ]);

        $user = User::where('email', $request->email)->first();

        if (! $user || ! Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['Email atau password salah.'],
            ]);
        }

        // Hapus token lama agar tidak menumpuk
        $user->tokens()->delete();

        $token = $user->createToken('fotografer-device')->plainTextToken;

        return response()->json([
            'token' => $token,
            'user'  => $user->only([
                'id', 'name', 'brand_name', 'username', 'email',
                'phone', 'avatar_path', 'city',
            ]),
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json(['message' => 'Logout berhasil.']);
    }

    public function me(Request $request): JsonResponse
    {
        return response()->json($request->user());
    }

    public function updateProfile(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name'       => 'sometimes|string|max:100',
            'brand_name' => 'sometimes|string|max:100',
            'username'   => 'sometimes|string|max:40|regex:/^[a-zA-Z0-9_\-]+$/|unique:users,username,' . $request->user()->id,
            'phone'      => 'sometimes|string|max:20',
            'whatsapp'   => 'sometimes|string|max:20',
            'instagram'  => 'sometimes|string|max:100',
            'bio'        => 'sometimes|string|max:1000',
            'city'       => 'sometimes|string|max:100',
            'notification_settings' => 'sometimes|array',
        ]);

        $request->user()->update($data);

        return response()->json($request->user()->fresh());
    }
}
