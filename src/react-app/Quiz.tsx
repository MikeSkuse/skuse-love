import { useState } from 'react';
import { Link } from 'react-router-dom';

const questions = [
  { question: 'When did Mike and Anna first meet?', answers: ['February 2021', 'June 2022', 'November 2022', 'January 2023'], correct: 'November 2022', feedback: 'Mike and Anna first met in November 2022, almost exactly four years before their wedding!' },
  { question: 'Where did Mike and Anna go on their first date?', answers: ['Lydiard Park', 'Coate Water', 'Cotswold Water Park', 'Barbury Castle'], correct: 'Coate Water', feedback: 'They walked around Coate Water several times because neither wanted the date to end.' },
  { question: 'How many laps of the lake did they approximately walk on their first date?', answers: ['1–2', '3–4', '5–6', '9–10'], correct: '5–6', feedback: 'They just kept walking and talking!' },
  { question: 'How many times had Mike and Anna visited Walt Disney World together before their wedding?', answers: ['Once', 'Twice', 'Three times', 'Four times'], correct: 'Twice', feedback: "They've already enjoyed two magical trips to Walt Disney World together." },
  { question: 'Which country have Mike and Anna visited twice to go to LEGOLAND?', answers: ['Germany', 'France', 'Denmark', 'Sweden'], correct: 'Denmark', feedback: "They've visited LEGOLAND Billund, the original LEGOLAND, twice together." },
  { question: "What is Eva's middle name?", answers: ['Rose', 'Elizabeth', 'Marie', 'Marlene'], correct: 'Marlene', feedback: 'Eva Marlene was born on 13 February 2026.' },
  { question: "What was Eva's nickname before she was born?", answers: ['Peanut', 'Bobette', 'Jellybean', 'Mini Skuse'], correct: 'Bobette', feedback: 'Before she was Eva, she was affectionately known as Bobette!' },
  { question: "Which of these is NOT the name of one of Mike and Anna's dogs?", answers: ['Rolo', 'Trixie', 'Molly', 'Bella'], correct: 'Bella', feedback: 'Their three dogs are Rolo, Trixie and Molly.' },
  { question: "What are Mike and Anna's favourite sweets, featured in the wedding favours?", answers: ['Spogs and white jazzies', 'Jelly Babies and Love Hearts', 'Milk Bottles and Haribo', 'Flying Saucers and Dolly Mixtures'], correct: 'Spogs and white jazzies', feedback: 'Mike loves spogs, while Anna loves white jazzies.' },
  { question: "Which Disney Pixar film inspired the name of the wedding's top table, Axiom?", answers: ['Toy Story', 'The Incredibles', 'WALL-E', 'Monsters, Inc.'], correct: 'WALL-E', feedback: 'The Axiom is the spaceship from WALL-E!' },
];

function shuffledAnswers() {
  return questions.map(({ answers }) => {
    const shuffled = [...answers];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  });
}

function resultFor(score: number) {
  if (score === 10) return ['The Ultimate Skuse Expert', 'Are you secretly part of the family?'];
  if (score >= 8) return ['Practically Family', 'You know us pretty well!'];
  if (score >= 6) return ['Disney Sidekick', 'A very respectable effort!'];
  if (score >= 4) return ['A Brick Short', "You're still building your knowledge!"];
  return ['Once Upon a Time', 'Have we met before?'];
}

export default function Quiz() {
  const [order, setOrder] = useState(shuffledAnswers);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const current = questions[index];

  function answer(value: string) {
    if (selected !== null) return;
    setSelected(value);
    if (value === current.correct) setScore(previous => previous + 1);
  }
  function next() {
    if (index === questions.length - 1) setFinished(true);
    else { setIndex(index + 1); setSelected(null); }
  }
  function restart() {
    setOrder(shuffledAnswers()); setIndex(0); setSelected(null); setScore(0); setFinished(false);
  }
  const [resultTitle, resultMessage] = resultFor(score);

  return <div className="quiz-page">
    <header className="page-header"><span className="eyebrow">A LITTLE WEDDING DAY MAGIC</span><h1>How Well Do You Know the Skuses?</h1><div className="ornament" aria-hidden="true">✦ <span>✧</span> ✦</div></header>
    {finished ? <section className="quiz-card quiz-results" aria-labelledby="quiz-result-title">
      {score >= 8 && <div className="quiz-confetti" aria-hidden="true">{Array.from({ length: 24 }, (_, i) => <span key={i} style={{ left: `${(i * 37) % 100}%`, animationDelay: `${(i % 8) * -0.35}s` }}/>)}</div>}
      <div className="quiz-sparkle" aria-hidden="true">✦</div><span className="eyebrow">YOUR RESULTS</span>
      <p className="quiz-final-score">{score}<span> / {questions.length}</span></p><p className="quiz-percentage">{score * 10}% correct</p>
      <h2 id="quiz-result-title">{resultTitle}</h2><p>{resultMessage}</p>
      <button className="quiz-primary" type="button" onClick={restart}>Play again</button><Link className="quiz-home" to="/">Return to the wedding homepage</Link>
    </section> : <>
      <p className="intro">A little quiz about our favourite memories. How many will you get right?</p>
      <div className="quiz-progress"><div><span>Question {index + 1} of {questions.length}</span><strong>Score: {score}</strong></div><div className="quiz-progress-track" role="progressbar" aria-label="Quiz progress" aria-valuemin={0} aria-valuemax={questions.length} aria-valuenow={index + (selected !== null ? 1 : 0)}><div style={{ width: `${(index + (selected !== null ? 1 : 0)) * 10}%` }}/></div></div>
      <section className="quiz-card" aria-labelledby="quiz-question"><span className="quiz-question-label">QUESTION {String(index + 1).padStart(2, '0')} <span aria-hidden="true">✧</span></span><h2 id="quiz-question">{current.question}</h2>
        <div className="quiz-answers">{order[index].map((option, i) => {
          const state = selected !== null ? option === current.correct ? ' correct' : option === selected ? ' incorrect' : '' : '';
          return <button key={option} type="button" className={'quiz-answer' + state} disabled={selected !== null} onClick={() => answer(option)}><span className="quiz-answer-letter">{String.fromCharCode(65 + i)}</span><span>{option}</span>{state && <span className="quiz-answer-mark" aria-hidden="true">{state === ' correct' ? '✓' : '×'}</span>}</button>;
        })}</div>
        {selected !== null && <div className="quiz-feedback" role="status"><strong>{selected === current.correct ? 'That’s right!' : 'Not quite!'}</strong><p>{current.feedback}</p></div>}
        {selected !== null && <button className="quiz-primary" type="button" onClick={next}>{index === questions.length - 1 ? 'See your results' : 'Next question'} <span aria-hidden="true">→</span></button>}
      </section>
    </>}
  </div>;
}
