import * as AWS from "aws-sdk";
// import { Paper, ProgressStatus } from "./";
import { PutItemInputAttributeMap } from "aws-sdk/clients/dynamodb";

const dynamodb = new AWS.DynamoDB({
  region: "us-east-1"
});
const TABLE_NAME = "paper-pdf-extarct";

interface DynamoDBPaperGetParams extends PutItemInputAttributeMap {
  paperId: {
    S: string;
  };
}

// interface DynamoDBPaperParams extends DynamoDBPaperGetParams {
//   paperUrls: {
//     SS: string[];
//   };
//   paperImages: {
//     SS: string[];
//   };
//   paperPdf: {
//     S: string;
//   };
//   status: {
//     S: ProgressStatus;
//   };
// }

class DynamoDBManager {
  async getPaperItem(paperId: string) {
    const key: DynamoDBPaperGetParams = {
      paperId: {
        S: paperId
      }
    };
    const params = {
      Key: key,
      TableName: TABLE_NAME
    };

    try {
      const data = await dynamodb.getItem(params).promise();
      if (data.Item) {
        console.log(data.Item);

        return data.Item;
      }
      return null;
    } catch (err) {
      console.error("ERROR OCCURRED AT GET DYNAMO_DB ITEM");
      throw new Error(err);
    }
  }
}

const dynamoDBManger = new DynamoDBManager();

export default dynamoDBManger;

// export async function updateDynamoDB(paper: Paper) {
//   const item: DynamoDBPaperParams = {
//     paperId: {
//       S: paper.paperId
//     },
//     paperUrls: {
//       SS: paper.paperUrls
//     },
//     paperImages: {
//       SS: paper.paperImages
//     },
//     paperPdf: {
//       S: paper.paperPdf
//     },
//     status: {
//       S: paper.status
//     }
//   };

//   const params = {
//     Item: item,
//     TableName: TABLE_NAME
//   };

//   try {
//     await dynamodb.putItem(params).promise();
//   } catch (err) {
//     console.error("ERROR OCCURRED AT UPDATE DYNAMO DB");
//     throw new Error(err);
//   }
// }
