import Button from '../../../components/ui/Button'
import Input from '../../../components/ui/Input'

export default function ProofingPinGate({ pinInput, setPinInput, onSubmit }) {
  return (
    <div className="rb-proof-gate">
      <div className="rb-proof-gate__card">
        <span className="rb-proof-gate__badge">Sesi Proofing</span>
        <h2 className="rb-proof-gate__title">Pilih Foto Favorit Anda</h2>
        <p className="rb-proof-gate__sub">Masukkan PIN keamanan 6 digit yang diberikan fotografer.</p>
        <form onSubmit={onSubmit}>
          <Input
            type="password"
            maxLength={6}
            placeholder="Masukkan PIN (Contoh: 1234)"
            value={pinInput}
            onChange={(e) => setPinInput(e.target.value)}
            className="rb-proof-gate__input"
            required
          />
          <Button type="submit" fullWidth disabled={!pinInput}>
            Buka Foto
          </Button>
        </form>
      </div>
    </div>
  )
}
