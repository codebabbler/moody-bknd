import express, { Express, Request, Response } from "express";
import logger from "./logger";
import morgan from "morgan";

const app: Express = express();
const port: number = 3000;

const morganFormat = ":method :url :status :response-time ms";

app.use(
  morgan(morganFormat, {
    stream: {
      write: (message: string) => {
        const messageParts = message.trim().split(" ");
        const logObject = {
          method: messageParts[0] || "",
          url: messageParts[1] || "",
          status: messageParts[2] || "",
          responseTime: messageParts[3] || "",
        };
        logger.info(JSON.stringify(logObject));
      },
    },
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.get("/", (_req: Request, res: Response) => {
  res.send("Hello, world!");
});

app.post("/login", (_req: Request, res: Response) => {
  res.send("Login successful!");
});

interface User {
  id: number;
  name: string;
}

app.get("/users", (_req: Request, res: Response) => {
  const users: User[] = [{ id: 1, name: "John Doe" }];
  res.json(users);
});

interface Profile {
  name: string;
  email: string;
}

app.get("/profile", (_req: Request, res: Response) => {
  const profile: Profile = { name: "John Doe", email: "john.doe@example.com" };
  res.json(profile);
});

app.post("/profile", (_req: Request, res: Response) => {
  res.send("Profile created successfully!");
});

app.delete("/profile", (_req: Request, res: Response) => {
  res.send("Profile deleted successfully!");
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
