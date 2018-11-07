import * as rimraf from "rimraf";

export function cleanArtifacts(path: string) {
  rimraf(path, err => {
    if (err) {
      console.error(err);
    }
  });
}
