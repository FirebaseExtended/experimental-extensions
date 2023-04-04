// require("@tensorflow/tfjs-node");
// const use = require("@tensorflow-models/universal-sentence-encoder");

// /**
//  * Generates embeddings for a given array of sentences using Universal Sentence Encoder model.
//  *
//  * @param text a string or array of strings to be embedded.
//  * @param key the key of the text in the document.
//  * @returns an array of arrays containing 512 numbers representing the embedding of the text.
//  */
// export async function getEmbeddings(
// 	text: string | string[]
// ): Promise<number[]> {
// 	const model = await use.load();
// 	const embeddings = await model.embed(text.length ? text : [text]);
// 	return embeddings.arraySync();
// }
