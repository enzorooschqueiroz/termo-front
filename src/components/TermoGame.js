import React, { useEffect, useState, useRef } from 'react';

const API_BASE = 'https://147d-52-67-222-76.ngrok-free.app';


export default function TermoGame() {
  const [palavra, setPalavra] = useState('');
  const [status, setStatus] = useState('waiting');
  const [tentativas, setTentativas] = useState([]);
  const [input, setInput] = useState('');
  const [mensagem, setMensagem] = useState('');
  const [tempo, setTempo] = useState(0);
  const [nome, setNome] = useState('');
  const timerRef = useRef(null);

  useEffect(() => {
    fetch(`${API_BASE}/palavra`)
      .then(res => res.json())
      .then(data => {
        if (data.palavra) setPalavra(data.palavra.toLowerCase());
      })
      .catch(() => setMensagem('Erro ao carregar palavra'));
  }, []);

  useEffect(() => {
    if (status === 'playing') {
      timerRef.current = setInterval(() => {
        setTempo(t => t + 1);
      }, 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [status]);

  function iniciarJogo() {
    setStatus('playing');
    setTentativas([]);
    setInput('');
    setMensagem('');
    setTempo(0);
  }

  function verificarPalpite() {
    const palpite = input.toLowerCase().trim();
    if (palpite.length !== palavra.length) {
      setMensagem(`A palavra deve ter ${palavra.length} letras.`);
      return;
    }

    const resultado = Array.from(palavra).map((letra, i) => {
      if (palpite[i] === letra) return 'correto';
      else if (palavra.includes(palpite[i])) return 'quase';
      else return 'errado';
    });

    const novaTentativa = { palavra: palpite, resultado };
    const novasTentativas = [...tentativas, novaTentativa];

    setTentativas(novasTentativas);
    setInput('');
    setMensagem('');

    if (palpite === palavra) {
      setStatus('finished');
      clearInterval(timerRef.current);
      setMensagem('Você acertou! Digite seu nome para registrar.');
    } else if (novasTentativas.length >= 6) {
      setStatus('finished');
      clearInterval(timerRef.current);
      setMensagem(`Você perdeu! A palavra era "${palavra}".`);
    }
  }

  function registrarResultado() {
    if (!nome.trim()) {
      setMensagem('Por favor, digite seu nome.');
      return;
    }

    fetch(`${API_BASE}/resultado`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nome: nome.trim(),
        tentativas: tentativas.length,
        tempo,
      }),
    })
      .then(res => res.json())
      .then(data => {
        if (data.mensagem) {
          setMensagem('Resultado salvo! Obrigado por jogar.');
          setStatus('waiting');
          setNome('');
          setTentativas([]);
        } else {
          setMensagem(data.erro || 'Erro ao salvar resultado.');
        }
      })
      .catch(() => setMensagem('Erro ao registrar resultado.'));
  }

  return (
    <div className="termo-container">
      <h1>Termo</h1>

      {status === 'waiting' && (
        <>
          <p>A palavra do dia foi carregada.</p>
          <button className="btn" onClick={iniciarJogo}>Estou pronto!</button>
        </>
      )}

      {status === 'playing' && (
        <>
          <div className="tentativas">
            {[...Array(6)].map((_, i) => {
              const tentativa = tentativas[i];
              const letras = tentativa ? tentativa.palavra : '';
              const resultado = tentativa ? tentativa.resultado : [];

              return (
                <div key={i} className="linha">
                  {[...Array(palavra.length)].map((_, j) => (
                    <div
                      key={j}
                      className={`bloco ${resultado[j] || ''}`}
                    >
                      {(letras[j] || '').toUpperCase()}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
          <input
            type="text"
            value={input}
            maxLength={palavra.length}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && verificarPalpite()}
            autoFocus
            placeholder="Digite seu palpite"
            className="input-palpite"
          />
          <button className="btn" onClick={verificarPalpite}>Enviar</button>
          <p className="tempo">Tempo: {tempo}s</p>
        </>
      )}

      {status === 'finished' && (
        <>
          <p className="mensagem">{mensagem}</p>
          {tentativas.length <= 6 && tentativas.some(t => t.palavra === palavra) && (
            <>
              <input
                type="text"
                placeholder="Digite seu nome"
                value={nome}
                onChange={e => setNome(e.target.value)}
                className="input-nome"
              />
              <button className="btn" onClick={registrarResultado}>Registrar resultado</button>
            </>
          )}
          <button className="btn" onClick={() => setStatus('waiting')}>Jogar de novo</button>
        </>
      )}

      {mensagem && status !== 'finished' && <p className="mensagem">{mensagem}</p>}

      <style>{`
        .termo-container {
          max-width: 480px;
          margin: 30px auto;
          padding: 20px;
          background-color: #000;
          color: #fff;
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          border-radius: 12px;
          box-shadow: 0 0 5px #222;
          text-align: center;
        }

        h1 {
          margin-bottom: 25px;
          font-weight: 700;
          font-size: 2.5rem;
          letter-spacing: 3px;
          color: #fff;
        }

        .tentativas {
          margin: 20px 0 30px;
        }

        .linha {
          display: flex;
          justify-content: center;
          margin-bottom: 12px;
        }

        .bloco {
          width: 44px;
          height: 44px;
          margin: 3px;
          border: 2px solid #fff;
          border-radius: 8px;
          font-weight: 700;
          font-size: 22px;
          line-height: 44px;
          user-select: none;
          background-color: transparent;
          color: #fff;
          transition: background-color 0.3s ease, border-color 0.3s ease;
        }

        .bloco.correto {
          background-color: #2ecc71; /* verde */
          border-color: #2ecc71;
          color: #000;
        }

        .bloco.quase {
          background-color: #f1c40f; /* amarelo */
          border-color: #f1c40f;
          color: #000;
        }

        .bloco.errado {
          background-color: #555;
          border-color: #555;
          color: #ccc;
          opacity: 0.9;
        }

        .input-palpite, .input-nome {
          width: 100%;
          max-width: 320px;
          padding: 12px 15px;
          margin: 15px 0 15px;
          font-size: 1.1rem;
          border-radius: 10px;
          border: 2px solid #fff;
          background-color: #000;
          color: #fff;
          outline: none;
          transition: border-color 0.25s ease;
        }

        .input-palpite::placeholder,
        .input-nome::placeholder {
          color: #bbb;
          font-style: italic;
        }

        .input-palpite:focus, .input-nome:focus {
          border-color: #f1c40f;
          box-shadow: none;
        }

        .btn {
          background-color: #000;
          color: #fff;
          border: 2px solid #fff;
          padding: 12px 30px;
          font-weight: 700;
          font-size: 1.1rem;
          border-radius: 12px;
          cursor: pointer;
          margin: 10px 5px 0 5px;
          user-select: none;
          transition: background-color 0.3s ease, color 0.3s ease;
        }

        .btn:hover {
          background-color: #f1c40f;
          color: #000;
          border-color: #f1c40f;
        }

        .tempo {
          margin-top: 10px;
          font-weight: 600;
          font-size: 1rem;
          color: #f1c40f;
        }

        .mensagem {
          margin-top: 20px;
          font-weight: 600;
          font-size: 1.1rem;
          color: #f1c40f;
          min-height: 30px;
        }
      `}</style>
    </div>
  );
}
