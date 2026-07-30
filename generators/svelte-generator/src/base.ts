export const randomCongratMessage = () => {
  const messages = [
    "🎉 Well done! You just created a new Svelte page.",
    "🚀 Success! A fresh Svelte page is ready to roll.",
    "🌟 Nice work! Another Svelte page added to your app.",
    "🧩 All set! A new Svelte page has been scaffolded.",
    "🔧 Scaffold complete! Your new Svelte page is in place.",
    "✅ Built! Your Svelte page is scaffolded and ready.",
    "✨ Fantastic! Your new Svelte page is good to go.",
    "🎯 Nailed it! A brand new Svelte page just landed.",
    "💫 Awesome! Another Svelte page joins the party.",
    "⚡ Lightning fast! A new Svelte page created successfully.",
  ];
  return messages[Math.floor(Math.random() * messages.length)];
};
