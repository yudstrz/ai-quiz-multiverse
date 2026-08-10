export const DEFAULT_PRESETS = {
  general: [
    {
      question: "What is the capital city of France?",
      options: ["Berlin", "Paris", "Madrid", "Rome"],
      answer: 1,
      explanation: "Paris is the capital and largest city of France.",
    },
    {
      question: "Which element has the chemical symbol 'O'?",
      options: ["Gold", "Osmium", "Oxygen", "Zinc"],
      answer: 2,
      explanation: "Oxygen is a chemical element with symbol O and atomic number 8.",
    },
    {
      question: "What is 12 x 12?",
      options: ["120", "144", "132", "154"],
      answer: 1,
      explanation: "12 multiplied by 12 equals 144.",
    },
    {
      question: "Which planet is known as the Red Planet?",
      options: ["Venus", "Jupiter", "Mars", "Saturn"],
      answer: 2,
      explanation: "Mars appears reddish due to iron oxide (rust) on its surface.",
    },
    {
      question: "Primary color created by mixing Blue + Yellow?",
      options: ["Purple", "Green", "Orange", "Brown"],
      answer: 1,
      explanation: "Mixing blue and yellow pigments yields green.",
    },
  ],
  programming: [
    {
      question: "Which language runs natively in web browsers?",
      options: ["Python", "Java", "JavaScript", "C++"],
      answer: 2,
      explanation: "JavaScript is the native scripting language of all modern web browsers.",
    },
    {
      question: "What does HTML stand for?",
      options: ["Hyper Text Markup Language", "High Tech Modern Language", "Hyperlink Text Mode Link", "Home Tool Markup Language"],
      answer: 0,
      explanation: "HTML stands for HyperText Markup Language, the standard document format for web pages.",
    },
    {
      question: "In CSS, which keyword selects elements by class?",
      options: ["#hashtag", ".dot", ":colon", "@at"],
      answer: 1,
      explanation: "The dot (.) prefix selects HTML elements by class name in CSS.",
    },
    {
      question: "Which method converts a JSON string into a JS object?",
      options: ["JSON.stringify()", "JSON.parse()", "JSON.toObject()", "Object.parse()"],
      answer: 1,
      explanation: "JSON.parse() parses a JSON string into a JavaScript value/object.",
    },
    {
      question: "What is the primary function of Vite in modern web development?",
      options: ["Database ORM", "Frontend Build Tool", "CSS Compiler Only", "Version Control"],
      answer: 1,
      explanation: "Vite is a fast modern frontend build tool and dev server.",
    },
  ],
  space: [
    {
      question: "Which is the largest planet in our Solar System?",
      options: ["Saturn", "Jupiter", "Neptune", "Uranus"],
      answer: 1,
      explanation: "Jupiter is more than twice as massive as all the other planets combined.",
    },
    {
      question: "What force keeps planets in orbit around the Sun?",
      options: ["Magnetism", "Gravity", "Friction", "Centrifugal Force"],
      answer: 1,
      explanation: "Gravity is the attractive force that keeps astronomical bodies in orbit.",
    },
    {
      question: "What galaxy is Earth located in?",
      options: ["Andromeda", "Milky Way", "Sombrero", "Triangulum"],
      answer: 1,
      explanation: "Earth is located in the Orion Arm of the Milky Way galaxy.",
    },
    {
      question: "How long does light take to travel from Sun to Earth?",
      options: ["8 Seconds", "8 Minutes", "8 Hours", "8 Days"],
      answer: 1,
      explanation: "Light traveling at 300,000 km/s takes roughly 8 minutes and 20 seconds from the Sun to Earth.",
    },
    {
      question: "Which celestial body causes ocean tides on Earth?",
      options: ["The Sun", "The Moon", "Mars", "Asteroids"],
      answer: 1,
      explanation: "The Moon's gravitational pulling force creates ocean tides on Earth.",
    },
  ],
};
