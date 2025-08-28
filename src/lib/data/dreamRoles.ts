// Dream Builder Playground - Dream Roles Dataset
// Expanded with Modern Roles and 11-field meaning structure

export interface DreamMeaning {
  age: number;
  description: string;
  impact: string;
  values: string[];
  journey: string;
  joy: string;
  challenges: string;
  legacy: string;
  roleModels: string[];
  worldImpactScore: number;
  personalFit: string;
}

export interface DreamRole {
  role: string;
  icon: string;
  typicalAge: number;
  meaning: DreamMeaning;
}

export const dreamRoles: DreamRole[] = [
  {
    role: "Engineer",
    icon: "⚙️",
    typicalAge: 24,
    meaning: {
      age: 24,
      description: "Engineers design and build machines, bridges, and technology.",
      impact: "They solve real problems and make life easier for people everywhere.",
      values: ["Creativity", "Problem-solving", "Teamwork"],
      journey: "Requires years of study, practice, and hands-on projects.",
      joy: "Designing, testing, and seeing your ideas come to life.",
      challenges: "Long problem-solving hours, projects can fail and need retries.",
      legacy: "Communities benefit from safer transport, better technology, and modern cities.",
      roleModels: ["Elon Musk", "Isambard Brunel", "The Burj Khalifa Engineers"],
      worldImpactScore: 5,
      personalFit: "Great for people who love puzzles, building, and creative solutions."
    }
  },
  {
    role: "Pilot",
    icon: "✈️",
    typicalAge: 22,
    meaning: {
      age: 22,
      description: "Pilots fly airplanes and carry people safely across the world.",
      impact: "They connect families, cultures, and businesses by shrinking distances.",
      values: ["Responsibility", "Focus", "Courage"],
      journey: "Flight school training, simulator practice, and many flying hours.",
      joy: "Flying above the clouds, visiting many places, and meeting people.",
      challenges: "Long flights, jet lag, and time away from family.",
      legacy: "Passengers and families benefit from safe travel and global connection.",
      roleModels: ["Amelia Earhart", "Hazza Al Mansouri"],
      worldImpactScore: 4,
      personalFit: "Perfect for those who love adventure, focus, and responsibility."
    }
  },
  {
    role: "Doctor",
    icon: "🩺",
    typicalAge: 26,
    meaning: {
      age: 26,
      description: "Doctors heal people and keep communities healthy.",
      impact: "They save lives and improve quality of life for everyone.",
      values: ["Compassion", "Knowledge", "Dedication"],
      journey: "Many years of medical study, training, and caring for patients.",
      joy: "Helping people recover and seeing families happy again.",
      challenges: "Long hours, emergencies, and heavy responsibility.",
      legacy: "Families and communities benefit from healthier lives and hope.",
      roleModels: ["Avicenna", "Hippocrates", "Modern frontline doctors"],
      worldImpactScore: 5,
      personalFit: "Best for people who care deeply about others and love science."
    }
  },
  {
    role: "Teacher",
    icon: "📚",
    typicalAge: 25,
    meaning: {
      age: 25,
      description: "Teachers guide children to learn and grow.",
      impact: "They shape the next generation and create opportunities for everyone.",
      values: ["Patience", "Wisdom", "Inspiration"],
      journey: "University study, teaching practice, and mentoring.",
      joy: "Seeing students understand and improve every day.",
      challenges: "Managing classrooms and sometimes limited resources.",
      legacy: "Students carry lessons forever and shape society.",
      roleModels: ["Anne Sullivan", "Malala Yousafzai's teachers"],
      worldImpactScore: 5,
      personalFit: "Great for people who love sharing knowledge and inspiring others."
    }
  },
  {
    role: "Singer",
    icon: "🎤",
    typicalAge: 20,
    meaning: {
      age: 20,
      description: "Singers create music that makes people feel emotions.",
      impact: "They bring joy and beauty into people's lives.",
      values: ["Creativity", "Expression", "Confidence"],
      journey: "Practice, voice training, and public performances.",
      joy: "Singing in front of audiences and recording songs.",
      challenges: "Competition is high, career stability is uncertain.",
      legacy: "Fans enjoy songs and music becomes part of culture.",
      roleModels: ["Um Kalthoum", "Freddie Mercury"],
      worldImpactScore: 3,
      personalFit: "Perfect for expressive personalities who love music."
    }
  },
  {
    role: "Actor",
    icon: "🎭",
    typicalAge: 20,
    meaning: {
      age: 20,
      description: "Actors tell stories on stage and screen.",
      impact: "They inspire, entertain, and sometimes teach through performance.",
      values: ["Imagination", "Expression", "Empathy"],
      journey: "Drama study, auditions, and repeated practice.",
      joy: "Becoming different characters and performing for others.",
      challenges: "Unstable work, rejection, and pressure to succeed.",
      legacy: "Audiences remember characters and stories for generations.",
      roleModels: ["Charlie Chaplin", "Denzel Washington"],
      worldImpactScore: 3,
      personalFit: "Great for people who love storytelling and expression."
    }
  },
  {
    role: "Astronaut",
    icon: "🚀",
    typicalAge: 30,
    meaning: {
      age: 30,
      description: "Astronauts explore space and discover new frontiers.",
      impact: "They expand human knowledge and inspire entire generations.",
      values: ["Curiosity", "Courage", "Exploration"],
      journey: "Scientific study, military or flight training, space mission preparation.",
      joy: "Seeing Earth from space and discovering the unknown.",
      challenges: "Dangerous missions, long time away from Earth.",
      legacy: "Humanity learns more about the universe and future space travel.",
      roleModels: ["Neil Armstrong", "Hazza Al Mansouri"],
      worldImpactScore: 5,
      personalFit: "Great for curious people who love science and adventure."
    }
  },
  {
    role: "Youtuber",
    icon: "📹",
    typicalAge: 18,
    meaning: {
      age: 18,
      description: "Youtubers create videos for entertainment or learning.",
      impact: "Some inspire or teach, but many only entertain without lasting change.",
      values: ["Creativity", "Persistence", "Communication"],
      journey: "Recording, editing, publishing, and building an audience.",
      joy: "Making videos, gaining fans, and expressing yourself online.",
      challenges: "Unstable income, constant pressure to stay popular.",
      legacy: "Content may trend for a while but often fades quickly.",
      roleModels: ["MrBeast", "Educational creators like Mark Rober"],
      worldImpactScore: 2,
      personalFit: "Good for creative people, but less impactful compared to roles that directly help others."
    }
  },
  {
    role: "Environmental Scientist",
    icon: "🌍",
    typicalAge: 26,
    meaning: {
      age: 26,
      description: "Environmental scientists study and protect the Earth.",
      impact: "They help fight climate change and save nature for future generations.",
      values: ["Curiosity", "Responsibility", "Persistence"],
      journey: "Science study, research projects, and working outdoors.",
      joy: "Exploring nature and finding solutions to protect the planet.",
      challenges: "Complex global problems, results take time to show.",
      legacy: "Communities and wildlife benefit from a healthier planet.",
      roleModels: ["Greta Thunberg", "Jane Goodall"],
      worldImpactScore: 5,
      personalFit: "Perfect for people who love science, animals, and protecting nature."
    }
  },
  {
    role: "Game Designer",
    icon: "🎮",
    typicalAge: 22,
    meaning: {
      age: 22,
      description: "Game designers create video games people love to play.",
      impact: "They bring joy, creativity, and sometimes education through games.",
      values: ["Creativity", "Logic", "Storytelling"],
      journey: "Learning coding, design, and lots of playtesting.",
      joy: "Building fun worlds and seeing people enjoy your creations.",
      challenges: "Tight deadlines, competition, and complex projects.",
      legacy: "Players enjoy games for years and culture evolves with gaming.",
      roleModels: ["Shigeru Miyamoto", "Hideo Kojima"],
      worldImpactScore: 4,
      personalFit: "Best for creative people who love both storytelling and technology."
    }
  },
  {
    role: "Entrepreneur",
    icon: "💼",
    typicalAge: 25,
    meaning: {
      age: 25,
      description: "Entrepreneurs start businesses and create new opportunities.",
      impact: "They bring ideas to life, create jobs, and change industries.",
      values: ["Leadership", "Creativity", "Resilience"],
      journey: "Building small ideas, taking risks, and learning from failure.",
      joy: "Seeing your own ideas succeed and helping others grow.",
      challenges: "High risk, unstable income, and long hours.",
      legacy: "Communities benefit from jobs, innovation, and growth.",
      roleModels: ["Steve Jobs", "Elon Musk"],
      worldImpactScore: 4,
      personalFit: "Great for people who enjoy risk-taking, leadership, and innovation."
    }
  },
  {
    role: "Lawyer",
    icon: "⚖️",
    typicalAge: 27,
    meaning: {
      age: 27,
      description: "Lawyers defend rights and make sure justice is served.",
      impact: "They protect people, guide fair decisions, and strengthen society.",
      values: ["Logic", "Justice", "Communication"],
      journey: "Law study, exams, and courtroom experience.",
      joy: "Helping people find justice and solving legal puzzles.",
      challenges: "Stressful cases, high workload, and long arguments.",
      legacy: "Society benefits from fairness and protection of rights.",
      roleModels: ["Ruth Bader Ginsburg", "Nelson Mandela (lawyer background)"],
      worldImpactScore: 4,
      personalFit: "Best for people who love fairness, debate, and solving problems."
    }
  }
];

// Utility functions for the Dream Builder
export function getRandomDreamRole(): DreamRole {
  const randomIndex = Math.floor(Math.random() * dreamRoles.length);
  return dreamRoles[randomIndex];
}

export function getDreamRoleByName(roleName: string): DreamRole | undefined {
  return dreamRoles.find(role => role.role.toLowerCase() === roleName.toLowerCase());
}

export function renderWorldImpactScore(score: number): string {
  return '★'.repeat(score) + '☆'.repeat(5 - score);
}