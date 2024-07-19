export const getOptValue = (optValue: string | undefined, defaultValue: string | number): any => {
  if (optValue == undefined || optValue === "") {
    return defaultValue;
  }
  if (typeof defaultValue === "number") {
    return Number(optValue);
  }

  return optValue;
};
