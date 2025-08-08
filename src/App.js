import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import Components from './Components';

const { ScratchCard, PaymentModal, PrizeModal, GameStats } = Components;

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const App = () => {
  const [gameState, setGameState] = useState('waiting'); // waiting, purchasing, ready, scratching, revealed
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showPrizeModal, setShowPrizeModal] = useState(false);
  const [currentPrize, setCurrentPrize] = useState(null);
  const [gameStats, setGameStats] = useState({
    totalTickets: 0,
    totalWinnings: 0,
    lastWin: null
  });
  const [scratchProgress, setScratchProgress] = useState(0);
  const [tickets, setTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);

  // Preços disponíveis
  const ticketPrices = [
    { value: 5, label: 'R$ 5,00', color: 'bg-green-500' },
    { value: 10, label: 'R$ 10,00', color: 'bg-blue-500' },
    { value:25, label: 'R$ 25,00', color: 'bg-purple-500' },
    { value: 50, label: 'R$ 50,00', color: 'bg-red-500' }
  ];

  const [selectedPrice, setSelectedPrice] = useState(ticketPrices[0]);

  // Gerar prêmio baseado no preço do bilhete
  const generatePrize = (ticketPrice) => {
    const random = Math.random();
    let prizes;
    
    switch (ticketPrice) {
      case 5:
        prizes = [
          { amount: 0, probability: 0.75, message: 'Tente novamente!' },
          { amount: 5, probability: 0.15, message: 'Recuperou o valor!' },
          { amount: 15, probability: 0.08, message: 'Triplicou!' },
          { amount: 50, probability: 0.019, message: 'Grande prêmio!' },
          { amount: 250, probability: 0.001, message: 'JACKPOT!' }
        ];
        break;
      case 10:
        prizes = [
          { amount: 0, probability: 0.70, message: 'Tente novamente!' },
          { amount: 10, probability: 0.18, message: 'Recuperou o valor!' },
          { amount: 30, probability: 0.10, message: 'Triplicou!' },
          { amount: 100, probability: 0.019, message: 'Grande prêmio!' },
          { amount: 500, probability: 0.001, message: 'JACKPOT!' }
        ];
        break;
      case 25:
        prizes = [
          { amount: 0, probability: 0.65, message: 'Tente novamente!' },
          { amount: 25, probability: 0.20, message: 'Recuperou o valor!' },
          { amount: 75, probability: 0.12, message: 'Triplicou!' },
          { amount: 250, probability: 0.029, message: 'Grande prêmio!' },
          { amount: 1000, probability: 0.001, message: 'JACKPOT!' }
        ];
        break;
      case 50:
        prizes = [
          { amount: 0, probability: 0.60, message: 'Tente novamente!' },
          { amount: 50, probability: 0.22, message: 'Recuperou o valor!' },
          { amount: 150, probability: 0.15, message: 'Triplicou!' },
          { amount: 500, probability: 0.029, message: 'Grande prêmio!' },
          { amount: 2500, probability: 0.001, message: 'JACKPOT!' }
        ];
        break;
      default:
        prizes = [
          { amount: 0, probability: 0.75, message: 'Tente novamente!' }
        ];
    }

    let cumulative = 0;
    for (let prize of prizes) {
      cumulative += prize.probability;
      if (random <= cumulative) {
        return prize;
      }
    }
    return prizes[prizes.length - 1];
  };

  const handleBuyTicket = () => {
    setShowPaymentModal(true);
  };

  const handlePaymentSuccess = (paymentData) => {
    // Simular compra bem-sucedida
    const newTicket = {
      id: Date.now(),
      price: selectedPrice.value,
      purchased: new Date(),
      prize: generatePrize(selectedPrice.value),
      scratched: false
    };
    
    setTickets(prev => [...prev, newTicket]);
    setSelectedTicket(newTicket);
    setGameState('ready');
    setShowPaymentModal(false);
    
    // Atualizar estatísticas
    setGameStats(prev => ({
      ...prev,
      totalTickets: prev.totalTickets + 1
    }));
  };

  const handleScratchComplete = () => {
    if (selectedTicket) {
      const updatedTicket = { ...selectedTicket, scratched: true };
      setTickets(prev => prev.map(t => t.id === selectedTicket.id ? updatedTicket : t));
      setSelectedTicket(updatedTicket);
      setCurrentPrize(selectedTicket.prize);
      setGameState('revealed');
      setShowPrizeModal(true);
      
      // Atualizar estatísticas
      setGameStats(prev => ({
        ...prev,
        totalWinnings: prev.totalWinnings + selectedTicket.prize.amount,
        lastWin: selectedTicket.prize.amount > 0 ? selectedTicket.prize : prev.lastWin
      }));
    }
  };

  const handleNewGame = () => {
    setSelectedTicket(null);
    setGameState('waiting');
    setScratchProgress(0);
    setShowPrizeModal(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      {/* Header */}
      <div className="bg-black/30 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="text-2xl font-bold text-white">
                🎰 Raspadinha Premiada
              </div>
            </div>
            <GameStats stats={gameStats} />
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {gameState === 'waiting' && (
          <div className="text-center space-y-8">
            <div>
              <h1 className="text-4xl font-bold text-white mb-4">
                Escolha seu bilhete da sorte! 🍀
              </h1>
              <p className="text-xl text-white/80">
                Raspe e ganhe prêmios incríveis instantaneamente!
              </p>
            </div>

            {/* Seleção de preços */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto">
              {ticketPrices.map((price) => (
                <button
                  key={price.value}
                  onClick={() => setSelectedPrice(price)}
                  className={`p-6 rounded-xl border-2 transition-all duration-300 transform hover:scale-105 ${
                    selectedPrice.value === price.value
                      ? 'border-yellow-400 bg-yellow-400/20 shadow-lg'
                      : 'border-white/30 bg-white/10 hover:border-white/50'
                  }`}
                >
                  <div className={`w-16 h-16 rounded-full mx-auto mb-3 flex items-center justify-center text-2xl font-bold text-white ${price.color}`}>
                    {price.value}
                  </div>
                  <p className="text-white font-semibold">{price.label}</p>
                  <p className="text-white/60 text-sm mt-1">
                    Prêmio máx: R$ {price.value === 5 ? '250' : price.value === 10 ? '500' : price.value === 25 ? '1.000' : '2.500'}
                  </p>
                </button>
              ))}
            </div>

            <button
              onClick={handleBuyTicket}
              className="bg-gradient-to-r from-yellow-500 to-orange-500 text-black font-bold text-xl px-12 py-4 rounded-xl hover:from-yellow-400 hover:to-orange-400 transform hover:scale-105 transition-all duration-300 shadow-lg"
            >
              Comprar Bilhete {selectedPrice.label}
            </button>
          </div>
        )}

        {(gameState === 'ready' || gameState === 'scratching' || gameState === 'revealed') && selectedTicket && (
          <div className="text-center space-y-8">
            <div>
              <h2 className="text-3xl font-bold text-white mb-2">
                {gameState === 'ready' ? 'Raspe seu bilhete!' : gameState === 'scratching' ? 'Continue raspando...' : 'Resultado!'}
              </h2>
              <p className="text-white/80">
                {gameState === 'ready' ? 'Use o mouse ou dedo para raspar a área cinza' : gameState === 'scratching' ? `Progresso: ${Math.round(scratchProgress)}%` : ''}
              </p>
            </div>

            <ScratchCard
              ticket={selectedTicket}
              onScratchProgress={setScratchProgress}
              onScratchComplete={handleScratchComplete}
              gameState={gameState}
              onGameStateChange={setGameState}
            />

            {gameState === 'revealed' && (
              <button
                onClick={handleNewGame}
                className="bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold text-lg px-8 py-3 rounded-xl hover:from-green-400 hover:to-emerald-400 transform hover:scale-105 transition-all duration-300 shadow-lg"
              >
                Jogar Novamente
              </button>
            )}
          </div>
        )}

        {/* Histórico de bilhetes */}
        {tickets.length > 0 && (
          <div className="mt-12 bg-black/20 backdrop-blur-sm rounded-xl p-6">
            <h3 className="text-xl font-bold text-white mb-4">Seus Bilhetes</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {tickets.map((ticket) => (
                <div key={ticket.id} className="bg-white/10 rounded-lg p-4 border border-white/20">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-white font-semibold">R$ {ticket.price}</span>
                    <span className={`px-2 py-1 rounded text-xs ${ticket.scratched ? 'bg-green-500/20 text-green-300' : 'bg-yellow-500/20 text-yellow-300'}`}>
                      {ticket.scratched ? 'Raspado' : 'Novo'}
                    </span>
                  </div>
                  {ticket.scratched && (
                    <div className="text-center">
                      <p className={`font-bold ${ticket.prize.amount > 0 ? 'text-green-300' : 'text-gray-300'}`}>
                        {ticket.prize.amount > 0 ? `R$ ${ticket.prize.amount}` : 'Sem prêmio'}
                      </p>
                      <p className="text-white/60 text-xs">{ticket.prize.message}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Modais */}
      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        ticketPrice={selectedPrice}
        onPaymentSuccess={handlePaymentSuccess}
      />

      <PrizeModal
        isOpen={showPrizeModal}
        onClose={() => setShowPrizeModal(false)}
        prize={currentPrize}
        onNewGame={handleNewGame}
      />
    </div>
  );
};

export default App;