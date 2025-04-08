import React, { useState } from 'react';

interface Entity {
  entityEnglishId: string;
  matchedText: string;
  confidenceScore: number;
}

interface Entailment {
  entailedWords: string[];
}

interface SentimentResult {
  sentiment: 'positif' | 'négatif' | 'neutre';
  score: number;
  confidence: number;
  entities: Entity[];
  entailments: Entailment[];
}

const SentimentAnalyzer: React.FC = () => {
  const [text, setText] = useState<string>('');
  const [result, setResult] = useState<SentimentResult | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const analyzeSentiment = async (text: string): Promise<SentimentResult> => {
    const apiKey = 'cb03bfb8a13d7915b0df1418c543c58b0c7a174975657c76f4dbfcc7';
    const corsProxy = 'https://cors-anywhere.herokuapp.com/';

    const formData = new URLSearchParams();
    formData.append('text', text);
    formData.append('extractors', 'entities,entailments');
    formData.append('language', 'eng');

    try {
      const response = await fetch(corsProxy + 'https://api.textrazor.com/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'x-textrazor-key': apiKey
        },
        body: formData.toString()
      });

      if (!response.ok) {
        throw new Error(`Erreur API: ${response.status}`);
      }

      const data = await response.json();
      console.log(data);

      const sentimentScore = data.response.sentiment?.score || 0;
      const confidence = data.response.sentiment?.confidence || 0.5;

      let sentiment: 'positif' | 'négatif' | 'neutre';
      if (sentimentScore > 0.1) {
        sentiment = 'positif';
      } else if (sentimentScore < -0.1) {
        sentiment = 'négatif';
      } else {
        sentiment = 'neutre';
      }

      let entityConfidenceSum = 0;
      if (data.response.entities && data.response.entities.length > 0) {
        entityConfidenceSum = data.response.entities.reduce(
          (sum: number, entity: Entity) => sum + entity.confidenceScore, 
          0
        ) / data.response.entities.length;
      }

      const finalConfidence = confidence * 0.7 + entityConfidenceSum * 0.3;

      return {
        sentiment,
        score: sentimentScore,
        confidence: finalConfidence,
        entities: data.response.entities || [],
        entailments: data.response.entailments || []
      };
    } catch (error) {
      console.error('Erreur lors de l\'appel à TextRazor:', error);
      throw error;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!text.trim()) {
      setError('Veuillez entrer du texte à analyser.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const sentimentResult = await analyzeSentiment(text);
      setResult(sentimentResult);
    } catch (err) {
      setError('Erreur lors de l\'analyse. Veuillez réessayer.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case 'positif':
        return '😃';
      case 'négatif':
        return '😞';
      default:
        return '😐';
    }
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positif':
        return 'bg-green-100 border-green-400 text-green-700';
      case 'négatif':
        return 'bg-red-100 border-red-400 text-red-700';
      default:
        return 'bg-gray-100 border-gray-400 text-gray-700';
    }
  };

  const getConfidenceBar = (confidence: number) => {
    const percentage = Math.min(Math.round(confidence * 100), 100);
    const getBarColor = () => {
      if (percentage >= 70) return 'bg-green-500';
      if (percentage >= 40) return 'bg-yellow-500';
      return 'bg-red-500';
    };

    return (
      <div className="w-full bg-gray-300 rounded-full h-4">
        <div 
          className={`${getBarColor()} h-4 rounded-full`} 
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
    );
  };

  const getSentimentIntensity = (score: number) => {
    const absScore = Math.abs(score);
    if (absScore < 0.3) return 'Faible';
    if (absScore < 0.6) return 'Modéré';
    return 'Fort';
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h1 className="text-2xl font-bold mb-6 text-center">Analyse de Sentiment avec TextRazor</h1>

      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="text" className="block text-sm font-medium text-gray-700 mb-2">
            Entrez votre texte:
          </label>
          <textarea
            id="text"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            rows={5}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Saisissez le texte à analyser..."
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
        >
          {loading ? 'Analyse en cours...' : 'Analyser'}
        </button>
      </form>

      {error && (
        <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {result && (
        <div className={`mt-6 p-4 rounded-lg border ${getSentimentColor(result.sentiment)}`}>
          <h2 className="text-xl font-semibold mb-4 flex items-center justify-between">
            <span>Résultats de l'analyse</span>
            <span className="text-3xl">{getSentimentIcon(result.sentiment)}</span>
          </h2>

          <div className="mb-4 p-3 bg-white bg-opacity-60 rounded shadow-sm">
            <span className="font-medium">Sentiment détecté:</span>{' '}
            <span className="font-bold capitalize">{result.sentiment}</span>
            <span className="ml-2 text-sm">({getSentimentIntensity(result.score)})</span>
          </div>

          <div className="mb-4">
            <span className="font-medium">Score de sentiment:</span>{' '}
            <span className="font-bold">{result.score.toFixed(2)}</span>
            <div className="w-full bg-gray-200 rounded-full h-2.5 mt-1">
              <div 
                className={`h-2.5 rounded-full ${result.score > 0 ? 'bg-green-600' : result.score < 0 ? 'bg-red-600' : 'bg-gray-600'}`} 
                style={{ width: `${Math.min(Math.abs(result.score * 100), 100)}%` }}
              ></div>
            </div>
          </div>

          <div className="mb-4">
            <span className="font-medium">Indice de confiance:</span>{' '}
            <span className="font-bold">{(result.confidence * 100).toFixed(0)}%</span>
            {getConfidenceBar(result.confidence)}
          </div>

          {result.entities.length > 0 && (
            <div className="mb-3">
              <h3 className="font-semibold mb-2">Entités détectées:</h3>
              <div className="bg-white bg-opacity-60 p-3 rounded">
                <ul className="space-y-1">
                  {result.entities.slice(0, 5).map((entity, index) => (
                    <li key={index} className="flex justify-between">
                      <span>
                        <span className="font-medium">{entity.entityEnglishId}:</span> {entity.matchedText}
                      </span>
                      <span className="text-sm italic">
                        {(entity.confidenceScore * 100).toFixed(0)}%
                      </span>
                    </li>
                  ))}
                  {result.entities.length > 5 && (
                    <li className="text-sm text-gray-500 mt-1">
                      + {result.entities.length - 5} autres entités...
                    </li>
                  )}
                </ul>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SentimentAnalyzer;