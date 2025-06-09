import React, { useEffect, useState, useRef } from 'react';

const API_BASE = 'http://52.67.222.76:5003';

export default function TermoGame() {
  const [palavra, setPalavra] = useState('');
  const [status, setStatus] = useState('waiting'); // waiting, playing, finished
  const [tentativas, setTentativas] = useState(0);
  const [inputTermo, setInputTermo] = useState('');
  const [mensagem, setMensagem] = useState('');
  const [tempo, setTempo] = useState(0);
  const [nome, setNome] = useState('');
  const timerRef = useRef(null);

  // Buscar palavra do dia ao carregar
  useEffect(() => {
    fetch(`${API_BASE}/palavra`)
      .then(res => res.json())
      .then(data => {
        if (data.palavra) setPalavra(data.palavra.toLowerCase());
      })
      .catch(() => setMensagem('Erro ao carregar palavra'));
  }, []);

  // Timer para contar segundos enquanto joga
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
    setTentativas(0);
    setInputTermo('');
    setMensagem('');
    setTempo(0);
  }

  function verificarTermo() {
    if (inputTermo.trim().toLowerCase() === palavra) {
      // Acertou
      setStatus('finished');
      clearInterval(timerRef.current);
      setMensagem('Parabéns! Você acertou! Digite seu nome para salvar o resultado.');
    } else {
      // Errou
      const novasTentativas = tentativas + 1;
      setTentativas(novasTentativas);
      setMensagem(`Tentativa ${novasTentativas}/6 incorreta.`);
      setInputTermo('');
      if (novasTentativas >= 6) {
        setStatus('finished');
        clearInterval(timerRef.current);
        setMensagem(`Fim do jogo! A palavra correta era "${palavra}".`);
      }
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
        tentativas: tentativas,
        tempo: tempo,
      }),
    })
      .then(res => res.json())
      .then(data => {
        if (data.mensagem) {
          setMensagem('Resultado registrado com sucesso! Obrigado por jogar.');
          setStatus('waiting');
          setNome('');
        } else if (data.erro) {
          setMensagem(`Erro: ${data.erro}`);
        }
      })
      .catch(() => setMensagem('Erro ao enviar resultado.'));
  }

  return (
    <div style={{ maxWidth: 400, margin: 'auto', fontFamily: 'Arial, sans-serif' }}>
      <h1>Jogo do Termo</h1>
      {status === 'waiting' && (
        <>
          <p>Palavra do dia carregada.</p>
          <button onClick={iniciarJogo}>Estou pronto!</button>
          {mensagem && <p>{mensagem}</p>}
        </>
      )}

      {status === 'playing' && (
        <>
          <p>Tente adivinhar a palavra (tentativas: {tentativas}/6)</p>
          <input
            type="text"
            value={inputTermo}
            onChange={e => setInputTermo(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && verificarTermo()}
            autoFocus
          />
          <button onClick={verificarTermo} disabled={!inputTermo.trim()}>
            Testar
          </button>
          <p>Tempo: {tempo}s</p>
          {mensagem && <p>{mensagem}</p>}
        </>
      )}

      {status === 'finished' && (
        <>
          <p>{mensagem}</p>
          {tentativas < 6 && (
            <>
              <input
                type="text"
                placeholder="Digite seu nome"
                value={nome}
                onChange={e => setNome(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && registrarResultado()}
                autoFocus
              />
              <button onClick={registrarResultado} disabled={!nome.trim()}>
                Registrar resultado
              </button>
            </>
          )}
          {tentativas >= 6 && (
            <button onClick={() => setStatus('waiting')}>
              Jogar novamente
            </button>
          )}
        </>
      )}
    </div>
  );
}
