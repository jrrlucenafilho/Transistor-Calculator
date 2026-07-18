import { useState } from 'react'
import './App.css'

function parseValue(s) {
  if (!s || s.trim() === '') return NaN
  const match = s.trim().match(/^(-?\d+\.?\d*)([mukM]?)$/)
  if (!match) return NaN
  const num = parseFloat(match[1])
  const suffix = match[2]
  if (suffix === 'm') return num * 1e-3
  if (suffix === 'u') return num * 1e-6
  if (suffix === 'k') return num * 1e3
  if (suffix === 'M') return num * 1e6
  return num
}

function fmt(v) {
  if (v === undefined || isNaN(v)) return '—'
  if (Math.abs(v) >= 1e6) return (v / 1e6).toFixed(2) + ' M'
  if (Math.abs(v) >= 1e3) return (v / 1e3).toFixed(2) + ' k'
  if (Math.abs(v) >= 1) return v.toFixed(2)
  if (Math.abs(v) >= 1e-3) return (v * 1e3).toFixed(2) + ' m'
  if (v === 0) return '0'
  return v.toExponential(2)
}

function fmtMa(v) {
  if (v === undefined || isNaN(v)) return '—'
  const mv = v * 1000
  if (mv >= 1) return mv.toFixed(2) + ' mA'
  if (mv >= 1e-3) return (mv * 1e3).toFixed(2) + ' uA'
  return (mv * 1e6).toFixed(2) + ' nA'
}

const fields = [
  { key: 'R1', label: 'R₁', placeholder: '100k', hint: 'Ω' },
  { key: 'R2', label: 'R₂', placeholder: '22k', hint: 'Ω' },
  { key: 'Rc', label: 'Rc', placeholder: '3.3k', hint: 'Ω' },
  { key: 'Re', label: 'Re', placeholder: '1k', hint: 'Ω' },
  { key: 'Vbe', label: 'Vbe', placeholder: '0.7', hint: 'V' },
  { key: 'Vcc', label: 'Vcc', placeholder: '12', hint: 'V' },
]

function LoadLine({ Vcc, Vce, Ic, Icsat }) {
  if (Vcc === undefined || Vcc <= 0 || Icsat === undefined || Icsat <= 0) return null

  const Ic_mA = Ic * 1000
  const Icsat_mA = Icsat * 1000

  const BM = 64
  const PL = 76
  const PT = 28
  const PW = 220
  const PH = 220
  const W = PL + PW + 52
  const H = PT + PH + BM

  function sx(vce) { return PL + (vce / Vcc) * PW }
  function sy(ic) { return PT + PH - (ic / Icsat_mA) * PH }

  const xSat = sx(0), ySat = sy(Icsat_mA)
  const xCut = sx(Vcc), yCut = sy(0)
  const qx = sx(Vce), qy = sy(Ic_mA)

  const xTicks = 5
  const yTicks = 5

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="loadline-svg" xmlns="http://www.w3.org/2000/svg" fontFamily="system-ui, sans-serif" fontSize="10">
      <rect x="0" y="0" width={W} height={H} fill="transparent" />

      <line x1={PL} y1={PT} x2={PL} y2={PT + PH} stroke="#333" strokeWidth="1.5" />
      <line x1={PL} y1={PT + PH} x2={PL + PW} y2={PT + PH} stroke="#333" strokeWidth="1.5" />

      <text x={PL + PW / 2} y={PT + PH + 52} textAnchor="middle" fill="#333" fontSize="12" fontWeight="bold">Vce (V)</text>
      <text x={PL} y={PT - 10} textAnchor="middle" fill="#333" fontSize="12" fontWeight="bold">Ic (mA)</text>

      {Array.from({ length: xTicks + 1 }, (_, i) => {
        const v = (i / xTicks) * Vcc
        const x = sx(v)
        return (
          <g key={`xt-${i}`}>
            <line x1={x} y1={PT + PH} x2={x} y2={PT + PH + 5} stroke="#333" strokeWidth="1" />
            <text x={x} y={PT + PH + 14} textAnchor="middle" fill="#555">{v.toFixed(1)}</text>
          </g>
        )
      })}

      {Array.from({ length: yTicks + 1 }, (_, i) => {
        const v = (i / yTicks) * Icsat_mA
        const y = sy(v)
        return (
          <g key={`yt-${i}`}>
            <line x1={PL - 5} y1={y} x2={PL} y2={y} stroke="#333" strokeWidth="1" />
            <text x={PL - 8} y={y + 3} textAnchor="end" fill="#555">{v.toFixed(2)}</text>
          </g>
        )
      })}

      <line x1={xSat} y1={ySat} x2={xCut} y2={yCut} stroke="#e53935" strokeWidth="2.5" />

      <circle cx={xSat} cy={ySat} r="3" fill="#e53935" />
      <text x={xSat - 32} y={ySat - 6} textAnchor="end" fill="#e53935" fontSize="11" fontWeight="bold">
        I<text fontSize="9" dy="3">c(sat)</text>
      </text>
      <text x={xSat - 32} y={ySat + 2} textAnchor="end" fill="#333" fontSize="9">
        {fmtMa(Icsat)}
      </text>
      <text x={xSat + 20} y={ySat + 5} fill="#c62828" fontSize="10" fontWeight="bold">Ponto de Saturação</text>

      <circle cx={xCut} cy={yCut} r="3" fill="#e53935" />
      <text x={xCut + 40} y={yCut + 30} textAnchor="end" fill="#e53935" fontSize="11" fontWeight="bold">Ponto de Corte</text>

      <circle cx={qx} cy={qy} r="5" fill="#1565c0" stroke="#fff" strokeWidth="1.5" />
      <text x={qx + 8} y={qy - 6} fill="#1565c0" fontSize="13" fontWeight="bold">Q</text>

      <line x1={qx} y1={qy} x2={PL} y2={qy} stroke="#1565c0" strokeWidth="1" strokeDasharray="4,3" />
      <text x={PL + 4} y={qy - 4} textAnchor="start" fill="#1565c0" fontSize="10">
        Ic = {fmtMa(Ic)}
      </text>

      <line x1={qx} y1={qy} x2={qx} y2={PT + PH} stroke="#1565c0" strokeWidth="1" strokeDasharray="4,3" />
      <text x={qx} y={PT + PH + 30} textAnchor="middle" fill="#1565c0" fontSize="10">
        Vce = {fmt(Vce)}
      </text>
    </svg>
  )
}

function App() {
  const [inputs, setInputs] = useState({
    R1: '100k',
    R2: '22k',
    Rc: '3.3k',
    Re: '1k',
    Vbe: '0.7',
    Vcc: '12',
  })

  const handleChange = (key) => (e) => {
    setInputs({ ...inputs, [key]: e.target.value })
  }

  const values = {}
  for (const { key } of fields) {
    values[key] = parseValue(inputs[key])
  }

  const { R1, R2, Rc, Re, Vbe, Vcc } = values

  let V2, Ve, Ie, Ic, Vc, Vce, Icsat
  const valid = [R1, R2, Rc, Re, Vbe, Vcc].every(v => !isNaN(v) && v > 0)

  if (valid) {
    V2 = (R2 / (R1 + R2)) * Vcc
    Ve = V2 - Vbe
    Ie = Ve / Re
    Ic = Ie
    Vc = Vcc - (Rc * Ic)
    Vce = Vc - Ve
    Icsat = Vcc / (Rc + Re)
  }

  return (
    <div className="container">
      <h1 className="title">Calculadora de Transistor</h1>

      <div className="card">
        <h2 className="section-title">Parâmetros do Circuito</h2>
        <div className="input-grid">
          {fields.map(({ key, label, placeholder, hint }) => (
            <div key={key} className="input-group">
              <label htmlFor={key}>{label}</label>
              <div className="input-wrap">
                <input
                  id={key}
                  type="text"
                  inputMode="decimal"
                  value={inputs[key]}
                  onChange={handleChange(key)}
                  placeholder={placeholder}
                />
                <span className="hint">{hint}</span>
              </div>
            </div>
          ))}
        </div>
        <p className="legend">Sufixos: m = ×10⁻³, u = ×10⁻⁶, k = ×10³, M = ×10⁶</p>
      </div>

      <div className="card">
        <h2 className="section-title">Resultados</h2>
        <div className="results">
          <div className="result-item">
            <span className="result-label">Vce</span>
            <span className="result-value">{fmt(Vce)}</span>
            <span className="result-unit">V</span>
          </div>
          <div className="result-item">
            <span className="result-label">Ic</span>
            <span className="result-value">{fmtMa(Ic)}</span>
          </div>
          <div className="result-item">
            <span className="result-label">Ic<sub>(sat)</sub></span>
            <span className="result-value">{fmtMa(Icsat)}</span>
          </div>
        </div>
      </div>

      {valid && Vce !== undefined && Ic !== undefined && (
        <div className="card">
          <h2 className="section-title">Reta de Carga</h2>
          <LoadLine Vcc={Vcc} Vce={Vce} Ic={Ic} Icsat={Icsat} />
        </div>
      )}
    </div>
  )
}

export default App
