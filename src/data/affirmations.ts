export const affirmations = [
  "You're doing amazing, one step at a time 🌟",
  "Every small action is a victory worth celebrating 🎉",
  "Your well-being matters more than productivity 🌿",
  "Today is full of possibilities, and you're ready for them ✨",
  "Be gentle with yourself — growth takes time 🌱",
  "You deserve rest just as much as you deserve success 💫",
  "Your journey is unique, and that's your superpower 🦦",
  "Progress, not perfection, is the goal 🎯",
  "You are enough, exactly as you are right now 💛",
  "Take a deep breath — you've got this 🌊",
  "Small steps every day lead to big changes 🏔️",
  "Your peace of mind is your greatest achievement 🕊️",
  "It's okay to start over. Every moment is a fresh beginning 🌅",
  "You're building something beautiful, even on hard days 🏗️",
  "Celebrate how far you've come, not just how far you have to go 🎊",
  "Your body and mind deserve kindness today 🤗",
  "Rest is productive. Pause is powerful. You are worthy. 🌙",
  "The fact that you're here, trying, is enough 🌻",
  "You bring something unique to this world that no one else can 🦋",
  "Trust the process. Trust yourself. You're exactly where you need to be 🗺️",
  "Today, choose joy in the little things 🌈",
  "Your potential is limitless, but your pace is perfectly fine 🐢",
  "Breathe in possibility, breathe out doubt 🍃",
  "You are the author of your story — make it a kind one 📖",
  "Happiness is found in the journey, not just the destination 🛤️",
  "Be proud of yourself for showing up today 💪",
  "You're allowed to take up space and be yourself 🌍",
  "Every sunrise is a new chance to be kind to yourself ☀️",
  "Your feelings are valid, and so are your dreams 💭",
  "Romо believes in you! Keep going, friend 🦦💕"
];

export function getDailyAffirmation(): string {
  const today = new Date();
  const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 86400000);
  return affirmations[dayOfYear % affirmations.length];
}
