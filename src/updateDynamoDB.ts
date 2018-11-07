import * as AWS from "aws-sdk";
import { Paper } from "./";
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

  async updateDynamoDB(paper: Paper) {
    const params: AWS.DynamoDB.Types.UpdateItemInput = {
      TableName: TABLE_NAME,
      Key: {
        paperId: { S: paper.paperId }
      },
      UpdateExpression: "set paperImages=:i, paperPdf=:p, status=:s",
      ExpressionAttributeValues: {
        ":i": { SS: paper.paperImages },
        ":p": { S: paper.paperPdf },
        ":s": { S: paper.status }
      }
    };

    try {
      await dynamodb.updateItem(params).promise();
    } catch (err) {
      console.error("ERROR OCCURRED AT UPDATE DYNAMO_DB ITEM");
      throw new Error(err);
    }
  }
}

const dynamoDBManger = new DynamoDBManager();

export default dynamoDBManger;
