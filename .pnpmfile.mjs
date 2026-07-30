export const hooks = {
  beforePacking(pkg) {
    if (process.env.NODE_ENV === "test") {
      for (const key of ["dependencies", "devDependencies"]) {
        for (const name of Object.keys({ ...pkg[key] })) {
          if (name.includes("kosmo")) {
            pkg[key][name] = "workspace:^";
          }
        }
      }
    }
    return pkg;
  },
};
