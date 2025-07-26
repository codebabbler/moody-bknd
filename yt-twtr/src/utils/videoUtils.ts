import ffprobe from "ffprobe-static";
import { spawn } from "child_process";

export const getVideoDuration = async (videoPath: string): Promise<number> => {
  return new Promise((resolve, reject) => {
    const ffprobeProcess = spawn(ffprobe.path, [
      "-v",
      "quiet",
      "-print_format",
      "json",
      "-show_format",
      videoPath,
    ]);

    let output = "";
    let errorOutput = "";

    ffprobeProcess.stdout.on("data", (data) => {
      output += data.toString();
    });

    ffprobeProcess.stderr.on("data", (data) => {
      errorOutput += data.toString();
    });

    ffprobeProcess.on("close", (code) => {
      if (code !== 0) {
        reject(
          new Error(`FFprobe process exited with code ${code}: ${errorOutput}`)
        );
        return;
      }

      try {
        const result = JSON.parse(output);
        const duration = parseFloat(result.format.duration);

        if (isNaN(duration)) {
          reject(new Error("Could not determine video duration"));
          return;
        }

        resolve(Math.round(duration));
      } catch (error) {
        reject(new Error(`Failed to parse ffprobe output: ${error}`));
      }
    });

    ffprobeProcess.on("error", (error) => {
      reject(new Error(`Failed to start ffprobe: ${error.message}`));
    });
  });
};
