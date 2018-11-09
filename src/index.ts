import * as AWS from "aws-sdk";
import * as path from "path";
import { downloadPDF, PDFModel } from "./downloadPdf";
import { extractImgs } from "./extractImgs";
import { getImgFileNames } from "./getImgFilenames";
import { cleanSmallByteImages } from "./cleanImgs";
import { uploadFolder } from "./uploadToS3";
import DynamoDBManager from "./dynamoDBManager";
import { cleanArtifacts } from "./cleanArtifacts";
import { Message } from "aws-sdk/clients/sqs";

export type ProcessStatus = "failed" | "pending" | "done";

export interface MessageBody {
  paper_id: string;
}

export interface Paper {
  paperId: string;
  paperUrls?: string[];
  paperImages?: string[];
  paperPdf?: PDFModel;
  processStatus: ProcessStatus;
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

          if (msg.Body && msg.MessageId && msg.ReceiptHandle) {
            let message: MessageBody;
            try {
              message = getMessageObject(msg.Body);
            } catch (err) {
              return deleteMessage(msg.ReceiptHandle);
            }

            try {
              const paperModel = await getPaperModel(message.paper_id);

              if (!paperModel) {
                throw new Error(
                  "There isn't the target paper in Dynamo DB! it only exists in queue message."
                );
              }

              if (
                paperModel &&
                paperModel.process_status &&
                paperModel.process_status === "done"
              ) {
                console.log("It's already processed one");
                return deleteMessage(msg.ReceiptHandle);
              }

              const pdfResult = await downloadPDF(
                msg.MessageId,
                paperModel.paper_id,
                paperModel.paper_urls!
              );

              const pdfPath = pdfResult.pdfLocalPath;

              if (!pdfPath || pdfPath.length === 0) {
                console.log("There isn't any PDF file to extract");
                return sendJobFinished(paperModel.paper_id, "done", msg);
              }

              await extractImgs(pdfPath);
              const dirForPdfImg = path.resolve(pdfPath, "..");
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
                paperUrls: paperModel.paper_urls,
                paperImages,
                paperPdf: {
                  pdfUrl: paperPdf,
                  originUrl: pdfResult.originUrl
                },
                processStatus: "done"
              };

              await DynamoDBManager.updateDynamoDB(paper);
              cleanArtifacts(dirForPdfImg);
              deleteMessage(msg.ReceiptHandle);
            } catch (err) {
              console.error(err);
              await sendJobFinished(message.paper_id, "failed", msg);
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

async function sendJobFinished(
  paperId: string,
  status: ProcessStatus,
  msg: Message
) {
  await DynamoDBManager.updateDynamoDB({
    paperId,
    processStatus: status
  });
  deleteMessage(msg.ReceiptHandle!);
}

function getMessageObject(msg: string) {
  try {
    const message = JSON.parse(msg) as MessageBody;
    return message;
  } catch (err) {
    console.error("FAILED TO PARSING MESSAGE JSON", err);
    throw err;
  }
}

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

async function getPaperModel(paperId: string) {
  const paperModel = await DynamoDBManager.getPaperItem(paperId);

  if (paperModel) {
    return paperModel;
  }

  return null;
}
