export function log(
  module: string,
  data: string,
  lvl: "" | "ERR" | "LOG" = "LOG"
): void {
  switch (lvl) {
    case "LOG":
      if (process.env.BOT_ENV === "debug")
        console.log(`[${module}] [${lvl}]: ${data}\n`);
      return;

    case "ERR":
      return console.error(`[${module}] [${lvl}]: ${data}\n`);
  }
}

export function sleep(ms: number): Promise<void> {
  return new Promise((res) => setTimeout(res, ms));
}

export function normalizeName(item: string): string {
  const parts = item.split(/_/g);
  if (parts.length < 2) return item.toLowerCase();

  const builder = [];

  builder.push(parts.shift()?.toLowerCase());
  builder.push(
    ...parts.map((s) => s[0].toUpperCase() + s.slice(1).toLowerCase())
  );
  return builder.join("");
}
