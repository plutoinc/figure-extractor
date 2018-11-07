import * as AWS from "aws-sdk";
import * as path from "path";
import { downloadPDF } from "./downloadPdf";
import { extractImgs } from "./extractImgs";
import { getImgFileNames } from "./getImgFilenames";
import { cleanSmallByteImages } from "./cleanImgs";
import { uploadFolder } from "./uploadToS3";
import { updateDynamoDB } from "./updateDynamoDB";

export type ProgressStatus = "not_started" | "pending" | "done";

export interface MessageBody {
  paper_id: string;
  paper_urls: string[];
}

export interface Paper {
  paperId: string;
  paperUrls: string[];
  paperImages: string[];
  paperPdf: string;
  status: ProgressStatus;
}

const QUEUE_URL =
  "https://sqs.us-east-1.amazonaws.com/966390130392/figure-extract";

const sqs = new AWS.SQS({
  region: "us-east-1"
});

const params = {
  QueueUrl: QUEUE_URL
};

setInterval(() => {
  sqs.receiveMessage(params, function(err, data) {
    if (err) {
      console.log(err, err.stack);
      return;
    } else {
      if (data.Messages && data.Messages.length > 0) {
        const processes = data.Messages.map(async msg => {
          console.log(msg.Body);

          if (msg.Body && msg.MessageId) {
            try {
              const message = JSON.parse(msg.Body) as MessageBody;

              const pdfPath = await downloadPDF(msg.MessageId, message);

              if (!pdfPath || pdfPath.length === 0) {
                console.log("There isn't any PDF file to extract");
                if (msg.ReceiptHandle) {
                  return deleteMessage(msg.ReceiptHandle);
                }
              }

              await extractImgs(pdfPath);
              const dirForPdfImg = path.resolve(pdfPath, "../");
              const imgFilenames = getImgFileNames(dirForPdfImg);

              if (imgFilenames && imgFilenames.length > 0) {
                cleanSmallByteImages(imgFilenames, dirForPdfImg);
              }

              const s3Keys = await uploadFolder(dirForPdfImg, message.paper_id);
              const paperImages =
                s3Keys.filter(key => key.endsWith(".png")) || [];
              const paperPdf = s3Keys.find(key => key.endsWith(".pdf")) || "";

              const paper: Paper = {
                paperId: message.paper_id,
                paperUrls: message.paper_urls,
                paperImages,
                paperPdf,
                status: "done"
              };

              await updateDynamoDB(paper);
            } catch (err) {
              console.error(err);
            }

            // TODO: Change the position of the below logic
            if (msg.ReceiptHandle) {
              deleteMessage(msg.ReceiptHandle);
            }
          }
        });

        Promise.all(processes)
          .then(() => {
            console.log("DONE");
          })
          .catch(err => {
            console.error(err);
          });
      }
    }
  });
}, 1000);

function deleteMessage(receiptHandle: string) {
  const params = {
    QueueUrl: QUEUE_URL,
    ReceiptHandle: receiptHandle
  };

  sqs.deleteMessage(params, function(err, data) {
    if (err) console.log(err, err.stack);
    else console.log(data);
  });
}
