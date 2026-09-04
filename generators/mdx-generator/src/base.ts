export const randomCongratMessage = () => {
  const messages = [
    "🎉 Well done! You just created a new MDX page.",
    "🚀 Success! A fresh MDX page is ready to roll.",
    "🌟 Nice work! Another MDX page added to your site.",
    "✨ Fantastic! Your new MDX page is good to go.",
    "🎯 Nailed it! A brand new MDX page just landed.",
    "💫 Awesome! Another MDX page joins the party.",
    "⚡ Lightning fast! A new MDX page created successfully.",
  ];
  return messages[Math.floor(Math.random() * messages.length)];
};
