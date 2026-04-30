function beforePacking(pkg) {
  if (process.env.NODE_ENV === "test") {
    for (const name of Object.keys({ ...pkg.dependencies })) {
      if (name.includes("kosmo")) {
        pkg.dependencies[name] = "workspace:^";
      }
    }
  }
  return pkg;
}

module.exports = {
  hooks: {
    beforePacking,
  },
};
