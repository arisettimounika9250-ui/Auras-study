const vibeAdvice = { Focused: 'Choose one demanding task and protect a longer deep-work block.', Calm: 'Balance a focused block with a short review break.', Motivated: 'Use this momentum on a challenging topic or practice set.', Energetic: 'Try active recall, problem solving, or a timed exercise.', Tired: 'Pick one manageable task and work in a shorter block.', Stressed: 'Choose the smallest useful next step, then take a short break.', Distracted: 'Remove one distraction and work on a single small task.' };
const pick = (arr, n) => arr.slice(0, Math.max(0, n));
export function mockReply(message, context = {}) {
  const q = String(message || '').toLowerCase(); const vibe = context.vibe || 'Calm'; const tasks = context.tasks || []; const subjects = context.subjects || [];
  if (/quiz/.test(q)) return `Let's practice ${context.topic || 'your current topic'}. I can make a short quiz from the topic page; choose a subject and topic to get questions matched to your study plan.`;
  if (/explain|what does .+ mean|what is |what are |how does |how do |don't understand|do not understand|confused about|in simple english|in simple words/.test(q)) return `I can help explain that in simple English. Open the topic in Subjects and choose “Explain with AI” for a topic-specific explanation with an example, key ideas, a recap, and practice questions. You can also tell me the exact topic you are learning.`;
  if (/progress|how am i|analytics|how much have i studied|what have i completed/.test(q)) return `You have ${subjects.length} subject${subjects.length === 1 ? '' : 's'} and ${tasks.filter(t => t.status !== 'Completed').length} open task${tasks.filter(t => t.status !== 'Completed').length === 1 ? '' : 's'}. Your current study vibe is ${vibe}. Complete a focus session to build your progress history.`;
  if (/plan|today|study recommendation|what should|where do i start|what do i do next/.test(q)) { const first = tasks.find(t => t.status !== 'Completed'); return first ? `Based on your ${vibe.toLowerCase()} vibe, ${vibeAdvice[vibe] || vibeAdvice.Calm} Start with “${first.title}”${first.subject?.name ? ` for ${first.subject.name}` : ''} for about ${Math.min(25, first.estimatedMinutes || 25)} minutes, then reassess.` : `Based on your ${vibe.toLowerCase()} vibe, ${vibeAdvice[vibe] || vibeAdvice.Calm} Add a subject and one small task, then I can help you choose a clear next step.`; }
  return `I can help you plan, explain a topic, make a quiz, or review progress. With your ${vibe.toLowerCase()} study vibe, ${vibeAdvice[vibe] || vibeAdvice.Calm} What subject are you working on?`;
}
const mockTopicSuggestions = subject => {
  const title = subject || 'this subject';
  return [
    { title: `Core concepts and terminology in ${title}`, difficulty: 'Easy' },
    { title: `Components and basic principles of ${title}`, difficulty: 'Easy' },
    { title: `Worked introductory examples for ${title}`, difficulty: 'Easy' },
    { title: `Applications and problem-solving in ${title}`, difficulty: 'Medium' },
    { title: `Methods and calculations used in ${title}`, difficulty: 'Medium' },
    { title: `Connections between key concepts in ${title}`, difficulty: 'Medium' },
    { title: `Advanced analysis and design problems in ${title}`, difficulty: 'Hard' },
    { title: `Complex case study in ${title}`, difficulty: 'Hard' },
    { title: `Limitations and optimization in ${title}`, difficulty: 'Hard' },
    { title: `Foundational vocabulary and definitions for ${title}`, difficulty: 'Easy' },
    { title: `Structure and main components of ${title}`, difficulty: 'Easy' },
    { title: `Everyday examples of ${title}`, difficulty: 'Easy' },
    { title: `Compare common approaches in ${title}`, difficulty: 'Medium' },
    { title: `Step-by-step problem solving with ${title}`, difficulty: 'Medium' },
    { title: `Apply ${title} to a practical scenario`, difficulty: 'Medium' },
    { title: `Analyze a challenging scenario involving ${title}`, difficulty: 'Hard' },
    { title: `Evaluate trade-offs in advanced ${title}`, difficulty: 'Hard' },
    { title: `Design a solution using ${title}`, difficulty: 'Hard' },
  ];
};
export async function generate(kind, payload, context = {}) {
  const provider = process.env.AI_PROVIDER || 'mock';
  if (kind === 'chat') {
    payload = {
      ...payload,
      responseInstructions: 'Understand natural English, including informal phrasing and minor spelling or grammar mistakes. Reply in clear, simple English with short sentences, define difficult terms, and use examples when helpful. If the request is unclear, ask one brief follow-up question.',
    };
  }
  if (kind === 'explain') {
    payload = {
      ...payload,
      responseInstructions: 'Explain the topic in clear, simple English that students with different levels of experience can understand. Define technical terms in plain English and use short sentences. Be more detailed than a short definition: provide a 3-5 sentence explanation, 5-7 key concepts, a concrete everyday example, 4-6 ordered learning steps, 3-5 practical applications, 3-4 common mistakes, a short recap, and 5 practice questions. Return JSON with topic, simpleExplanation, keyConcepts, example, learningSteps, applications, commonMistakes, summary, and practiceQuestions. Write all explanatory text and questions in accessible English.',
    };
  }
  if (provider === 'mock' || !process.env.AI_API_KEY) return mockGenerate(kind, payload, context);
  if (provider === 'openai' || provider === 'groq') {
    const base = process.env.AI_BASE_URL || (provider === 'groq' ? 'https://api.groq.com/openai/v1' : 'https://api.openai.com/v1');
    const response = await fetch(`${base}/chat/completions`, { method: 'POST', headers: { 'Content-Type':'application/json', Authorization:`Bearer ${process.env.AI_API_KEY}` }, body: JSON.stringify({ model: process.env.AI_MODEL || (provider === 'groq' ? 'llama-3.3-70b-versatile' : 'gpt-4o-mini'), messages: [{ role:'system', content:'You are AuraStudy, a friendly academic study companion. Never diagnose. Respond as useful JSON when asked for structured output.' }, { role:'user', content: JSON.stringify({ kind, payload, studyContext: context }) }], temperature: 0.5 }) });
    if (!response.ok) throw new Error('AI provider request failed'); const data = await response.json(); const text = data.choices?.[0]?.message?.content || ''; return parseModelResult(text, kind, payload, context);
  }
  if (provider === 'gemini') {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${process.env.AI_MODEL || 'gemini-1.5-flash'}:generateContent?key=${process.env.AI_API_KEY}`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ contents:[{parts:[{text:`You are AuraStudy, a friendly academic study companion. Return concise JSON. Request: ${JSON.stringify({kind,payload,context})}`}]}]}) });
    if (!response.ok) throw new Error('AI provider request failed'); const data = await response.json(); return parseModelResult(data.candidates?.[0]?.content?.parts?.[0]?.text || '', kind, payload, context);
  }
  return mockGenerate(kind, payload, context);
}
function parseModelResult(text, kind, payload, context) { try { const clean = text.replace(/^```json\s*/i,'').replace(/```$/,''); return JSON.parse(clean); } catch { return mockGenerate(kind, payload, context, text); } }
function mockGenerate(kind, payload = {}, context = {}, modelText = '') {
  const title = payload.topic || payload.topicTitle || 'your topic'; const vibe = context.vibe || 'Calm';
  if (kind === 'chat') return { reply: modelText || mockReply(payload.message, context) };
  if (kind === 'topics') {
    const existing = new Set((payload.existingTopics || []).map(topic => String(topic).trim().toLowerCase()));
    const prompt = String(payload.prompt || '').trim();
    const focusMatch = prompt.match(/\b(?:about|on|for|in|covering)\s+(.+)$/i);
    const focus = focusMatch?.[1]?.replace(/[.!?]+$/, '').trim() || '';
    const requestedLevels = ['Easy', 'Medium', 'Hard'].filter(level => new RegExp(`\\b${level}\\b`, 'i').test(prompt));
    const focusedSuggestions = focus ? [
      { title: `Foundations of ${focus} in ${payload.subject}`, difficulty: 'Easy' },
      { title: `Key concepts and terminology in ${focus}`, difficulty: 'Easy' },
      { title: `Worked examples for ${focus}`, difficulty: 'Easy' },
      { title: `Basic components of ${focus}`, difficulty: 'Easy' },
      { title: `Everyday examples of ${focus}`, difficulty: 'Easy' },
      { title: `Introduction and definitions for ${focus}`, difficulty: 'Easy' },
      { title: `Apply ${focus} to ${payload.subject} problems`, difficulty: 'Medium' },
      { title: `Methods and problem-solving for ${focus}`, difficulty: 'Medium' },
      { title: `Connections between ${focus} and related concepts`, difficulty: 'Medium' },
      { title: `Compare common approaches to ${focus}`, difficulty: 'Medium' },
      { title: `Step-by-step practice with ${focus}`, difficulty: 'Medium' },
      { title: `Practical applications of ${focus}`, difficulty: 'Medium' },
      { title: `Analyze advanced problems involving ${focus}`, difficulty: 'Hard' },
      { title: `Evaluate design choices for ${focus}`, difficulty: 'Hard' },
      { title: `Develop a solution using ${focus}`, difficulty: 'Hard' },
      { title: `Investigate limitations and edge cases in ${focus}`, difficulty: 'Hard' },
      { title: `Solve a complex case study involving ${focus}`, difficulty: 'Hard' },
      { title: `Design and justify an advanced ${focus} solution`, difficulty: 'Hard' },
    ] : mockTopicSuggestions(payload.subject);
    const suggestions = focusedSuggestions
      .filter(topic => !requestedLevels.length || requestedLevels.includes(topic.difficulty))
      .filter(topic => !existing.has(topic.title.toLowerCase()));
    return { topics: suggestions.slice(0, 18).map(topic => ({ ...topic, description: `A suggested ${topic.difficulty.toLowerCase()}-level study topic for ${payload.subject}${focus ? `, focused on ${focus}` : ''}.`, estimatedMinutes: topic.difficulty === 'Easy' ? 20 : topic.difficulty === 'Medium' ? 30 : 45 })) };
  }
  if (kind === 'plan') { const tasks = (context.tasks || []).filter(t => t.status !== 'Completed'); return { title: 'A study plan that fits your vibe', blocks: pick(tasks, 4).map((t,i)=>({ time: ['Next block','After a break','Later today','Evening'][i], subject: t.subject?.name || 'Study', topic: t.title, minutes: Math.min(t.estimatedMinutes || 25, vibe === 'Tired' ? 20 : 45), taskId: t._id })) }; }
  if (kind === 'explain') return {
    topic: title,
    simpleExplanation: `To understand ${title}, first find out what problem it helps solve. Then look at its main parts one at a time and see how they work together. Do not just memorize the definition; connect the idea to a small example.`,
    keyConcepts: [
      `The definition and purpose of ${title}.`,
      'The information or inputs it needs.',
      'The important parts of the process.',
      'How the result changes at each step.',
      'How to understand the final result.',
      'How to use the same idea in a new problem.',
    ],
    example: `Choose a small problem and write down each step as you work through ${title}. Notice what information you use at each step and how it changes the result. Compare your answer with the original problem, then explain in your own words why the method worked.`,
    learningSteps: [
      `Read the definition of ${title} and learn what problem it solves.`,
      'Identify the important terms, inputs, and outputs.',
      'Work through an easy example one step at a time.',
      'Try the same method again without looking at the example.',
      'Use the idea in a new situation and check your result.',
    ],
    applications: [
      'Solve course problems in an organized way.',
      'Choose a suitable method for a new question.',
      'Compare different solutions and understand their results.',
      'Break a large problem into smaller, easier steps.',
    ],
    commonMistakes: [
      'Memorizing the definition without understanding the words.',
      'Skipping steps and jumping straight to the answer.',
      'Copying an example without understanding why each step works.',
      'Not checking whether the result answers the question.',
    ],
    summary: `To learn ${title}, understand its purpose, follow each step in an example, and then practise on a new problem by yourself.`,
    practiceQuestions: [
      `What problem does ${title} help solve? Explain in your own words.`,
      'What are the main parts, inputs, or outputs of this idea?',
      'How would you work through a small example, step by step?',
      'Where could you use this idea in a new situation?',
      `What is a common mistake to avoid when using ${title}?`,
    ],
  };
  if (kind === 'quiz') { const n = Math.max(1, Math.min(10, Number(payload.count) || 5)); const type=payload.questionType||'multiple-choice'; return { questions:Array.from({length:n},(_,i)=>type==='true-false'?({prompt:`True or false: ${title} is best learned by understanding its core idea and practicing an example.`,type:'true-false',options:['True','False'],answer:'True',explanation:`Connect the concept of ${title} to an example to check your understanding.`}):type==='short-answer'?({prompt:`In one sentence, what is the main purpose of ${title}?`,type:'short-answer',answer:`to solve a specific problem`,explanation:`A useful answer should describe what problem ${title} helps solve.`}):({ prompt:`Which statement best describes a core idea in ${title}? (${i+1})`, type:'multiple-choice', options:['It helps solve a specific problem using defined steps.','It removes the need to understand the problem.','It always produces the same result for every input.','It is unrelated to the subject.'], answer:0, explanation:`The first option describes the purpose of studying ${title}.` })) }; }
  return { reply: mockReply(payload.message, context) };
}
