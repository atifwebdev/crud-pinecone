import express from "express";
import { PineconeClient } from "@pinecone-database/pinecone";
import OpenAI from "openai";
import './config/index.mjs';
import cors from 'cors';
import { customAlphabet } from 'nanoid';
const nanoid = customAlphabet('1234567890', 20);
import path from 'path';
const __dirname = path.resolve();


const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const pinecone = new PineconeClient();
await pinecone.init({
  environment: process.env.PINECONE_ENVIRONMENT,
  apiKey: process.env.PINECONE_API_KEY,
});


const app = express();
app.use(express.json());
app.use(cors([]));

app.get('/', (req, res) => {
  res.send('Hello Weorld!')
})

// Read Or Show Request:
app.get("/api/v1/stories", async (req, res) => {
  const queryText = ""
  const response = await openai.embeddings.create({
    model: "text-embedding-ada-002",
    input: queryText,
  });
  const vector = response?.data[0]?.embedding;
  console.log("vector: ", vector);
  // [ 0.0023063174, -0.009358601, 0.01578391, ... , 0.01678391, ]

  const index = pinecone.Index(process.env.PINECONE_INDEX_NAME);
  const queryResponse = await index.query({
    queryRequest: {
      vector: vector,
      // id: "vec1",
      topK: 10000,
      includeValues: true,
      includeMetadata: true,
    }
  });

  queryResponse.matches.map(eachMatch => {
    console.log(`score ${eachMatch.score.toFixed(1)} => ${JSON.stringify(eachMatch.metadata)}\n\n`);
  })
  console.log(`${queryResponse.matches.length} records found `);

  res.send(queryResponse.matches)
});



// Post Request
app.post("/api/v1/story", async (req, res) => {
  console.log("req.body: ", req.body);
  // {
  //     title: "abc title",
  //     body: "abc text"
  // }

  // since pine cone can only store data in vector form (numeric representation of text)
  // we will have to convert text data into vector of a certain dimension (1536 in case of openai)
  const response = await openai.embeddings.create({
    model: "text-embedding-ada-002",
    input: `${req.body?.title} ${req.body?.body}`,
  });
  console.log("response?.data: ", response?.data);
  const vector = response?.data[0]?.embedding
  console.log("vector: ", vector);
  // [ 0.0023063174, -0.009358601, 0.01578391, ... , 0.01678391, ]

  const index = pinecone.Index(process.env.PINECONE_INDEX_NAME);
  const upsertRequest = {
    vectors: [
      {
        id: nanoid(), // unique id, // unique id
        values: vector,
        metadata: {
          title: req.body?.title,
          body: req.body?.body,
        }
      }
    ],
  };
  try {
    const upsertResponse = await index.upsert({ upsertRequest });
    console.log("upsertResponse: ", upsertResponse);

    res.send({
      message: "story created successfully"
    });
  } catch (e) {
    console.log("error: ", e)
    res.status(500).send({
      message: "failed to create story, please try later"
    });
  }
});


// Search Request
app.get("/api/v1/search", async (req, res) => {
  const queryText = req.query.q;
  const response = await openai.embeddings.create({
    model: "text-embedding-ada-002",
    input: queryText,
  });
  const vector = response?.data[0]?.embedding
  console.log("vector: ", vector);
  // [ 0.0023063174, -0.009358601, 0.01578391, ... , 0.01678391, ]

  const index = pinecone.Index(process.env.PINECONE_INDEX_NAME);
  const queryResponse = await index.query({
    queryRequest: {
      vector: vector,
      // id: "vec1",
      topK: 20,
      includeValues: false,
      includeMetadata: true,
      namespace: process.env.PINECONE_NAME_SPACE
    }
  });

  queryResponse.matches.map(eachMatch => {
    console.log(`score ${eachMatch.score.toFixed(3)} => ${JSON.stringify(eachMatch.metadata)}\n\n`);
  })
  console.log(`${queryResponse.matches.length} records found `);
  res.send(queryResponse.matches)
});


// Update Request
app.put("/api/v1/story/:id", async (req, res) => {

  console.log("req.params.id: ", req.params.id);
  console.log("req.body: ", req.body);
  // {
  //     title: "abc title",
  //     body: "abc text"
  // }

  // since pine cone can only store data in vector form (numeric representation of text)
  // we will have to convert text data into vector of a certain dimension (1536 in case of openai)
  const response = await openai.embeddings.create({
    model: "text-embedding-ada-002",
    input: `${req.body?.title} ${req.body?.body}`,
  });
  console.log("response?.data: ", response?.data);
  const vector = response?.data[0]?.embedding
  console.log("vector: ", vector);
  // [ 0.0023063174, -0.009358601, 0.01578391, ... , 0.01678391, ]
  const index = pinecone.Index(process.env.PINECONE_INDEX_NAME);
  const upsertRequest = {
    vectors: [
      {
        id: req.params.id, // unique id, // unique id
        values: vector,
        metadata: {
          title: req.body?.title,
          body: req.body?.body,
        }
      }
    ],
  };
  try {
    const upsertResponse = await index.upsert({ upsertRequest });
    console.log("upsertResponse: ", upsertResponse);

    res.send({
      message: "story updated successfully"
    });
  } catch (e) {
    console.log("error: ", e)
    res.status(500).send({
      message: "failed to create story, please try later"
    });
  }
});


// Delete Request
app.delete("/api/v1/story/:id", async (req, res) => {
  try {
    const index = pinecone.Index(process.env.PINECONE_INDEX_NAME);
    const deleteResponse = await index.delete1({
      ids: [req.params.id],
    });

    console.log("deleteResponse: ", deleteResponse);

    res.send({
      message: "story deleted successfully"
    });

  } catch (e) {
    console.log("error: ", e)
    res.status(500).send({
      message: "failed to create story, please try later"
    });
  }

});



const port = process.env.PORT || 5001;
app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});