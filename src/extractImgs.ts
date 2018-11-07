const { exec } = require("child_process");

export async function extractImgs(pdfPath: string) {
  console.log("START TO EXTRACT PNG");
  await new Promise((resolve, reject) => {
    exec(`pdfimages -png ${pdfPath} ${pdfPath}`, (err, stdout, stderr) => {
      if (err) {
        reject(err);
        return;
      }
      resolve();
      console.log(`stdout: ${stdout}`);
      console.log(`stderr: ${stderr}`);
    });
  });
  console.log("END TO EXTRACT PNG");
}
