import React, { useRef, useEffect, useState } from 'react';

// Componente do cartão de raspadinha
const ScratchCard = ({ ticket, onScratchProgress, onScratchComplete, gameState, onGameStateChange }) => {
  const canvasRef = useRef(null);
  const contextRef = useRef(null);
  const [isScratching, setIsScratching] = useState(false);
  const [scratchedPixels, setScratchedPixels] = useState(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext('2d');
    contextRef.current = context;

    // Configurar canvas para alta resolução
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    context.scale(dpr, dpr);
    canvas.style.width = rect.width + 'px';
    canvas.style.height = rect.height + 'px';

    // Desenhar overlay de raspadinha
    drawScratchOverlay(context, rect.width, rect.height);
  }, []);

  const drawScratchOverlay = (context, width, height) => {
    // Criar gradiente prateado
    const gradient = context.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, '#E5E5E5');
    gradient.addColorStop(0.5, '#C0C0C0');
    gradient.addColorStop(1, '#A0A0A0');
    
    context.fillStyle = gradient;
    context.fillRect(0, 0, width, height);
    
    // Adicionar textura
    context.fillStyle = '#B0B0B0';
    for (let i = 0; i < 150; i++) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      const size = Math.random() * 2 + 1;
      context.beginPath();
      context.arc(x, y, size, 0, Math.PI * 2);
      context.fill();
    }
    
    // Adicionar texto "RASPE AQUI"
    context.fillStyle = '#666';
    context.font = 'bold 24px Arial';
    context.textAlign = 'center';
    context.fillText('RASPE AQUI', width / 2, height / 2 - 10);
    context.font = 'bold 16px Arial';
    context.fillText('🎰 BOA SORTE! 🎰', width / 2, height / 2 + 20);
  };

  const getEventPos = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const clientX = e.clientX || (e.touches && e.touches[0].clientX);
    const clientY = e.clientY || (e.touches && e.touches[0].clientY);
    
    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  };

  const scratch = (e) => {
    if (!isScratching || gameState !== 'scratching') return;
    
    const pos = getEventPos(e);
    const context = contextRef.current;
    
    // Apagar área circular
    context.globalCompositeOperation = 'destination-out';
    context.beginPath();
    context.arc(pos.x, pos.y, 25, 0, Math.PI * 2);
    context.fill();
    
    // Calcular progresso
    calculateScratchProgress();
  };

  const calculateScratchProgress = () => {
    const canvas = canvasRef.current;
    const context = contextRef.current;
    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = imageData.data;
    
    let transparentPixels = 0;
    for (let i = 3; i < pixels.length; i += 4) {
      if (pixels[i] === 0) transparentPixels++;
    }
    
    const totalPixels = pixels.length / 4;
    const progress = (transparentPixels / totalPixels) * 100;
    
    setScratchedPixels(progress);
    onScratchProgress(progress);
    
    // Se raspou mais de 60%, considerar completo
    if (progress > 60 && gameState !== 'revealed') {
      setTimeout(() => {
        const context = contextRef.current;
        context.clearRect(0, 0, canvas.width, canvas.height);
        onScratchComplete();
      }, 500);
    }
  };

  const startScratch = (e) => {
    if (gameState !== 'ready' && gameState !== 'scratching') return;
    
    setIsScratching(true);
    onGameStateChange('scratching');
    scratch(e);
  };

  const stopScratch = () => {
    setIsScratching(false);
  };

  return (
    <div className="relative">
      <div className="w-96 h-64 mx-auto bg-gradient-to-br from-yellow-400 via-yellow-500 to-orange-500 rounded-xl shadow-2xl border-4 border-yellow-300 overflow-hidden">
        {/* Conteúdo do prêmio (por trás do overlay) */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6">
          <div className="text-4xl mb-4">
            {ticket.prize.amount > 0 ? '🎉' : '😔'}
          </div>
          <div className="text-2xl font-bold text-black mb-2">
            {ticket.prize.amount > 0 ? `R$ ${ticket.prize.amount}` : 'Sem Prêmio'}
          </div>
          <div className="text-lg text-black/80">
            {ticket.prize.message}
          </div>
          <div className="mt-4 text-sm text-black/60">
            Bilhete: #{ticket.id.toString().slice(-4)}
          </div>
        </div>
        
        {/* Canvas de raspadinha */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full cursor-crosshair"
          onMouseDown={startScratch}
          onMouseMove={scratch}
          onMouseUp={stopScratch}
          onMouseLeave={stopScratch}
          onTouchStart={startScratch}
          onTouchMove={scratch}
          onTouchEnd={stopScratch}
          style={{ touchAction: 'none' }}
        />
      </div>
      
      {gameState === 'scratching' && (
        <div className="mt-4 text-center">
          <div className="text-white mb-2">Progresso: {Math.round(scratchedPixels)}%</div>
          <div className="w-64 mx-auto bg-white/20 rounded-full h-2">
            <div 
              className="bg-yellow-400 h-2 rounded-full transition-all duration-300"
              style={{ width: `${scratchedPixels}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

// Modal de pagamento
const PaymentModal = ({ isOpen, onClose, ticketPrice, onPaymentSuccess }) => {
  const [paymentStep, setPaymentStep] = useState('method'); // method, processing, success
  const [selectedMethod, setSelectedMethod] = useState('card');

  useEffect(() => {
    if (isOpen) {
      setPaymentStep('method');
    }
  }, [isOpen]);

  const handlePayment = async () => {
    setPaymentStep('processing');
    
    // Simular processamento de pagamento
    setTimeout(() => {
      setPaymentStep('success');
      setTimeout(() => {
        onPaymentSuccess({ method: selectedMethod, amount: ticketPrice.value });
        onClose();
      }, 1500);
    }, 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full p-6">
        {paymentStep === 'method' && (
          <>
            <h3 className="text-2xl font-bold text-gray-800 mb-6 text-center">
              Finalizar Compra
            </h3>
            
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Bilhete:</span>
                <span className="font-semibold">{ticketPrice.label}</span>
              </div>
              <div className="flex justify-between items-center mt-2">
                <span className="text-gray-600">Total:</span>
                <span className="text-xl font-bold text-green-600">{ticketPrice.label}</span>
              </div>
            </div>

            <div className="space-y-3 mb-6">
              <label className="flex items-center p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="payment"
                  value="card"
                  checked={selectedMethod === 'card'}
                  onChange={(e) => setSelectedMethod(e.target.value)}
                  className="mr-3"
                />
                <div className="flex items-center">
                  <span className="text-2xl mr-3">💳</span>
                  <span>Cartão de Crédito</span>
                </div>
              </label>

              <label className="flex items-center p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="payment"
                  value="pix"
                  checked={selectedMethod === 'pix'}
                  onChange={(e) => setSelectedMethod(e.target.value)}
                  className="mr-3"
                />
                <div className="flex items-center">
                  <span className="text-2xl mr-3">📱</span>
                  <span>PIX</span>
                </div>
              </label>
            </div>

            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handlePayment}
                className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
              >
                Pagar {ticketPrice.label}
              </button>
            </div>
          </>
        )}

        {paymentStep === 'processing' && (
          <div className="text-center py-8">
            <div className="animate-spin w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              Processando Pagamento...
            </h3>
            <p className="text-gray-600">Aguarde alguns segundos</p>
          </div>
        )}

        {paymentStep === 'success' && (
          <div className="text-center py-8">
            <div className="text-6xl mb-4">✅</div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              Pagamento Aprovado!
            </h3>
            <p className="text-gray-600">Seu bilhete está pronto para ser raspado!</p>
          </div>
        )}
      </div>
    </div>
  );
};

// Modal de prêmio
const PrizeModal = ({ isOpen, onClose, prize, onNewGame }) => {
  if (!isOpen || !prize) return null;

  const isWinner = prize.amount > 0;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full p-6 text-center">
        <div className="text-6xl mb-4">
          {isWinner ? '🎉' : '😔'}
        </div>
        
        <h3 className="text-2xl font-bold text-gray-800 mb-4">
          {isWinner ? 'Parabéns!' : 'Que pena!'}
        </h3>
        
        <div className="mb-6">
          <div className={`text-3xl font-bold mb-2 ${isWinner ? 'text-green-600' : 'text-gray-600'}`}>
            {isWinner ? `R$ ${prize.amount}` : 'Sem Prêmio'}
          </div>
          <p className="text-gray-600 text-lg">
            {prize.message}
          </p>
        </div>

        {isWinner && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <p className="text-green-800 font-semibold">
              💰 Você ganhou R$ {prize.amount}!
            </p>
            <p className="text-green-600 text-sm mt-1">
              Em um jogo real, o valor seria creditado em sua conta.
            </p>
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Fechar
          </button>
          <button
            onClick={onNewGame}
            className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
          >
            Novo Jogo
          </button>
        </div>
      </div>
    </div>
  );
};

// Componente de estatísticas
const GameStats = ({ stats }) => {
  return (
    <div className="flex items-center space-x-6 text-white">
      <div className="text-center">
        <div className="text-lg font-bold">{stats.totalTickets}</div>
        <div className="text-xs text-white/60">Bilhetes</div>
      </div>
      <div className="text-center">
        <div className="text-lg font-bold">R$ {stats.totalWinnings}</div>
        <div className="text-xs text-white/60">Ganhos</div>
      </div>
      {stats.lastWin && (
        <div className="text-center">
          <div className="text-lg font-bold">R$ {stats.lastWin.amount}</div>
          <div className="text-xs text-white/60">Último Prêmio</div>
        </div>
      )}
    </div>
  );
};

// Exportar componentes
const Components = {
  ScratchCard,
  PaymentModal,
  PrizeModal,
  GameStats
};

export default Components;