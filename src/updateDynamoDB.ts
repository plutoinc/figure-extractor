import * as AWS from "aws-sdk";
import { Paper, ProgressStatus } from "./";
import { PutItemInputAttributeMap } from "aws-sdk/clients/dynamodb";

const dynamodb = new AWS.DynamoDB({
  region: "us-east-1"
});
const TABLE_NAME = "paper-pdf-extarct";

interface DynamoDBPaperParams extends PutItemInputAttributeMap {
  PaperId: {
    S: string;
  };
  paperUrls: {
    SS: string[];
  };
  paperImages: {
    SS: string[];
  };
  paperPdf: {
    S: string;
  };
  status: {
    S: ProgressStatus;
  };
}

export async function updateDynamoDB(paper: Paper) {
  const item: DynamoDBPaperParams = {
    PaperId: {
      S: paper.paperId
    },
    paperUrls: {
      SS: paper.paperUrls
    },
    paperImages: {
      SS: paper.paperImages
    },
    paperPdf: {
      S: paper.paperPdf
    },
    status: {
      S: paper.status
    }
  };

  const params = {
    Item: item,
    TableName: TABLE_NAME
  };

  try {
    await dynamodb.putItem(params).promise();
  } catch (err) {
    console.error("ERROR OCCURRED AT UPDATE DYNAMO DB");
    throw new Error(err);
  }
}
