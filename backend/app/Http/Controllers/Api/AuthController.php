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
                'id', 'name', 'brand_name', 'email',
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
