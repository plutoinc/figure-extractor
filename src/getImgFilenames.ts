import * as fs from "fs";

export function getImgFileNames(dirPath: string): string[] {
  const dir = fs.readdirSync(dirPath);
  const imgFiles = dir.filter(file => {
    const filenameArr = file.split(".");
    return filenameArr[filenameArr.length - 1].toLowerCase() === "png";
  });
  return imgFiles;
}
