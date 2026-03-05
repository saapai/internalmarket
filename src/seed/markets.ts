/**
 * Seed data for all 26 SEP Winter Formal superlative categories.
 * Each category has 3 candidate markets (YES/NO).
 */
export const CATEGORIES = [
  {
    title: "Indian of the Year",
    candidates: ["Yashas", "Arjun", "Priya"],
  },
  {
    title: "Most Likely to Become a CEO",
    candidates: ["Rahul", "Sneha", "Vikram"],
  },
  {
    title: "Life of the Party",
    candidates: ["DJ Karan", "Meera", "Aditya"],
  },
  {
    title: "Best Dressed",
    candidates: ["Ananya", "Rohan", "Ishita"],
  },
  {
    title: "Most Likely to Go Viral",
    candidates: ["Nikhil", "Kavya", "Siddharth"],
  },
  {
    title: "Cutest Couple",
    candidates: ["Riya & Aman", "Neha & Dev", "Pooja & Raj"],
  },
  {
    title: "Most Athletic",
    candidates: ["Kabir", "Tanya", "Harsh"],
  },
  {
    title: "Class Clown",
    candidates: ["Varun", "Diya", "Pranav"],
  },
  {
    title: "Most Likely to Win a Nobel Prize",
    candidates: ["Shreya", "Arnav", "Ritika"],
  },
  {
    title: "Best Hair",
    candidates: ["Saanvi", "Dhruv", "Aarav"],
  },
  {
    title: "Most Likely to Travel the World",
    candidates: ["Simran", "Kunal", "Aisha"],
  },
  {
    title: "Best Smile",
    candidates: ["Navya", "Ayaan", "Zara"],
  },
  {
    title: "Most Likely to Be Famous",
    candidates: ["Vihaan", "Kiara", "Reyansh"],
  },
  {
    title: "Biggest Foodie",
    candidates: ["Manav", "Myra", "Aryan"],
  },
  {
    title: "Best Dance Moves",
    candidates: ["Anvi", "Shaurya", "Sara"],
  },
  {
    title: "Most Likely to Write a Book",
    candidates: ["Ira", "Advait", "Nisha"],
  },
  {
    title: "Best Sense of Humor",
    candidates: ["Kabir M", "Aanya", "Om"],
  },
  {
    title: "Most Studious",
    candidates: ["Vivaan", "Samaira", "Atharv"],
  },
  {
    title: "Best Glow Up",
    candidates: ["Aditi", "Krishna", "Pari"],
  },
  {
    title: "Most Likely to Be a Billionaire",
    candidates: ["Rudra", "Anaya", "Laksh"],
  },
  {
    title: "Best Vocalist",
    candidates: ["Sia", "Aadi", "Trisha"],
  },
  {
    title: "Most Photogenic",
    candidates: ["Mira", "Yash", "Aadhya"],
  },
  {
    title: "Best Duo / Friendship",
    candidates: ["Rishi & Neil", "Tara & Maya", "Jay & Krish"],
  },
  {
    title: "Most Likely to Be on Shark Tank",
    candidates: ["Sanya", "Ishan", "Pihu"],
  },
  {
    title: "Biggest Flirt",
    candidates: ["Ahaan", "Kyra", "Rehan"],
  },
  {
    title: "Most School Spirit",
    candidates: ["Veer", "Avni", "Aarav K"],
  },
];

/**
 * Generate SQL insert statements for seeding
 */
export function generateSeedSQL(): string {
  const lines: string[] = [];
  CATEGORIES.forEach((cat, i) => {
    const catId = `cat_${i + 1}`;
    lines.push(
      `INSERT INTO categories (id, title, sort_order) VALUES (uuid_generate_v4(), '${cat.title.replace(/'/g, "''")}', ${i + 1});`
    );
  });
  return lines.join("\n");
}
