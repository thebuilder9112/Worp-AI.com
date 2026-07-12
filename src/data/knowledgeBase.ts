export interface KnowledgeEntry {
  id: string;
  category: 'concepts' | 'networks' | 'algorithms' | 'nlp';
  title: string;
  summary: string;
  details: string;
  keywords: string[];
}

export const KNOWLEDGE_BASE: KnowledgeEntry[] = [
  // --- ADVANCED AI CONCEPTS ---
  {
    id: "transformers-attention",
    category: "concepts",
    title: "Transformers & Self-Attention Mechanisms",
    summary: "The foundation of modern LLMs, utilizing self-attention to process entire sequences in parallel and weight token relationships dynamically.",
    details: `The Transformer architecture, introduced by Vaswani et al. in 'Attention Is All You Need' (2017), replaced recurrent architectures (LSTMs, GRUs) by relying entirely on self-attention.
Key components:
1. Scaled Dot-Product Attention: Calculates attention scores using Query (Q), Key (K), and Value (V) matrices:
   Attention(Q, K, V) = softmax(Q K^T / sqrt(d_k)) V
   where d_k is the dimension of the keys.
2. Multi-Head Attention: Projects Q, K, and V multiple times with different learnable linear projections, allowing the model to jointly attend to information from different representation subspaces.
3. Positional Encoding: Since Transformers do not process sequentially, sinusoidal positional encodings are added to input embeddings to preserve token ordering:
   PE_(pos, 2i) = sin(pos / 10000^(2i/d_model))
4. Encoder-Decoder Structure: The encoder processes the source sequence, while the decoder autoregressively generates the target sequence. Decoder layers use masked multi-head attention to prevent looking at future tokens.`,
    keywords: ["transformer", "attention", "self-attention", "query", "key", "value", "vaswani", "multi-head", "positional encoding"]
  },
  {
    id: "rag",
    category: "concepts",
    title: "Retrieval-Augmented Generation (RAG)",
    summary: "A technique that enhances LLM generation by retrieving relevant documents from an external custom knowledge source to ground response generation.",
    details: `Retrieval-Augmented Generation (RAG) combines dense retrieval and generative language models to provide factually accurate, context-grounded outputs, mitigating hallucinations.
RAG Workflow:
1. Ingestion: Documents are chunked (e.g., 500-token chunks with 10% overlap), processed through an embedding model (e.g., text-embedding-3), and saved in a vector database.
2. Retrieval: When a user query arrives, it is embedded using the same model. A similarity search (such as Cosine Similarity or dot-product) locates the top-K nearest neighbor document chunks.
3. Generation: The retrieved chunks are formatted as 'Context' and injected into the system prompt alongside the user query:
   [System Instruction: Use the following context to answer...]
   [Context: Chunk 1, Chunk 2...]
   [User: Query...]
4. Evaluation: Evaluated on Faithfulness (grounded in context), Answer Relevance (directly answers query), and Context Recall (captures all required information).`,
    keywords: ["rag", "retrieval", "retriever", "grounding", "vector database", "embeddings", "chunking", "hallucination", "cosine similarity"]
  },
  {
    id: "agentic-workflows",
    category: "concepts",
    title: "Agentic Workflows & Multi-Agent Systems",
    summary: "Systems where LLMs act as autonomous agents using iterative loops of reasoning, planning, tool usage, and collaboration to achieve goals.",
    details: `Agentic design patterns shift the LLM from a simple text-predictor into an active decision-making core.
Key Agentic Design Patterns (defined by Andrew Ng):
1. Reflection: The agent generates an output, evaluates its own work for bugs or inaccuracies (Self-Correction), and refines it iteratively.
2. Tool Use (Function Calling): The agent decides when to invoke external APIs, databases, or execution environments (e.g., python interpreters) to retrieve precise answers or perform actions.
3. Planning: The agent decomposes a complex goal into smaller sequential sub-tasks (e.g., Chain-of-Thought, Tree-of-Thoughts) and maintains a execution queue.
4. Multi-Agent Collaboration: Splitting a complex task across multiple specialized agents (e.g., a Coder, a Reviewer, a Project Manager) with distinct system prompts and communication protocols.`,
    keywords: ["agent", "agentic", "reflection", "tool calling", "planning", "chain of thought", "multi-agent", "reasoning", "loop"]
  },
  {
    id: "multimodal-ai",
    category: "concepts",
    title: "Multi-Modal AI & Joint Embeddings",
    summary: "Systems processing and linking multiple modalities (e.g. text, images, video, speech) in a unified representation space.",
    details: `Multi-Modal AI models represent diverse data types (e.g., text, visual, audio) in a shared embedding space or translate representation maps from one modality to another.
Key Architectures:
1. CLIP (Contrastive Language-Image Pre-training): Pre-trained by maximizing the cosine similarity of matching image-text pairs in a batch while minimizing it for non-matching pairs (Contrastive Learning).
2. Vision-Language Models (VLMs): Align visual features extracted by a Vision Transformer (ViT) with the text token embedding space of a Large Language Model using cross-attention layers or projection matrices.
3. Native Multimodality: Newer architectures (like Gemini) are trained natively from the ground up on text, image, audio, and video tokens simultaneously, allowing unified comprehension without discrete modular translation steps.`,
    keywords: ["multimodal", "clip", "contrastive", "vision transformer", "vit", "image embedding", "cross-attention", "modality"]
  },
  {
    id: "peft-lora",
    category: "concepts",
    title: "Parameter-Efficient Fine-Tuning (PEFT) & LoRA",
    summary: "Methods for adapting pre-trained foundation models to specialized tasks by freezing original weights and training a tiny set of adapter parameters.",
    details: `Fine-tuning large foundation models is computationally prohibitive. PEFT methods enable targeted adaptation with minimal hardware.
LoRA (Low-Rank Adaptation):
Instead of updating the full weight matrix W of size (d x k), LoRA factorizes the weight update matrix ΔW into two low-rank matrices A and B:
   W_updated = W + ΔW = W + (B * A)
where B is of size (d x r) and A is of size (r x k), with rank r << min(d, k) (typically r=8 or r=16).
- Matrix A is initialized with a Gaussian distribution, and Matrix B is initialized to 0, ensuring ΔW = 0 at the start of training.
- During training, W is frozen; only A and B are updated, reducing trainable parameters by 99%+.
QLoRA (Quantized LoRA):
Enhances LoRA by quantizing the base model weights to 4-bit NormalFloat (NF4) and using Double Quantization to reduce memory usage, making it possible to fine-tune 70B models on a single consumer GPU.`,
    keywords: ["peft", "lora", "qlora", "fine-tuning", "adapter", "low-rank", "quantization", "nf4", "weights"]
  },

  // --- NEURAL NETWORKS ---
  {
    id: "deep-learning-basics",
    category: "networks",
    title: "Deep Learning Foundations & Backpropagation",
    summary: "The basic mechanics of neural networks, including backpropagation of errors, gradient descent, and activation functions.",
    details: `A neural network consists of layers of interconnected nodes (neurons).
Key mathematical mechanics:
1. Forward Pass: Computes the linear combination of inputs and weights, adds bias, and applies an activation function (f):
   a_j = f( sum_i( w_ji * x_i ) + b_j )
2. Activation Functions: Introduce non-linearity, enabling networks to model complex functions:
   - ReLU: f(x) = max(0, x) (prevents vanishing gradient for positive values, but can cause 'dying ReLU' for negative inputs).
   - GELU (Gaussian Error Linear Unit): f(x) = x * P(X <= x) where P(X) is cumulative distribution (used in Transformers).
   - Sigmoid: f(x) = 1 / (1 + e^-x) (scales output between 0 and 1; used for binary classification).
3. Backpropagation: Computes the gradient of the loss function (L) with respect to every weight using the Chain Rule of calculus:
   ∂L/∂w_ji = (∂L/∂a_j) * (∂a_j/∂z_j) * (∂z_j/∂w_ji)
4. Gradient Descent: Weights are updated in the opposite direction of the gradient to minimize loss:
   w = w - η * (∂L/∂w)`,
    keywords: ["backpropagation", "gradient descent", "activation function", "relu", "gelu", "loss function", "chain rule", "neuron", "sigmoid"]
  },
  {
    id: "cnn",
    category: "networks",
    title: "Convolutional Neural Networks (CNNs)",
    summary: "Neural networks specialized in processing grid-structured data (like images) using parameter sharing and local receptive fields.",
    details: `CNNs are designed to capture spatial hierarchies in visual data.
Core Layers:
1. Convolutional Layer: Applies small learnable kernels (filters) over the spatial dimensions of the input. Each kernel computes a dot product at every position (sliding window), creating a Feature Map.
   This enforces:
   - Parameter Sharing: The same filter is applied across the entire image.
   - Translation Invariance: An object is recognized regardless of its position.
2. Pooling Layer (Max/Average): Downsamples spatial dimensions (width, height) to reduce computational load and control overfitting. Max pooling extracts the maximum value in a window.
3. ResNet (Residual Connections): Solves the vanishing gradient problem in very deep networks by adding shortcut connections ('skip connections') that bypass one or more layers:
   H(x) = F(x) + x
   where F(x) is the residual mapping. This allows gradients to flow directly back through the shortcuts.`,
    keywords: ["cnn", "convolution", "pooling", "filter", "feature map", "resnet", "skip connection", "spatial", "translation invariance"]
  },
  {
    id: "rnn-lstm",
    category: "networks",
    title: "Recurrent Neural Networks (RNNs) & LSTMs",
    summary: "Networks with feedback loops designed for processing sequential data, and LSTMs which solve their long-term dependency limitations.",
    details: `RNNs process sequences by maintaining a hidden state (h_t) that acts as a memory of previous tokens:
   h_t = tanh( W_hh * h_t-1 + W_xh * x_t + b_h )
Standard RNNs struggle with vanishing and exploding gradients over long sequences, making them unable to remember distant context.
LSTMs (Long Short-Term Memory):
Incorporate a dedicated Cell State (C_t) and three regulation gates:
1. Forget Gate (f_t): Decides what information to discard from the cell state:
   f_t = sigmoid( W_f * [h_t-1, x_t] + b_f )
2. Input Gate (i_t): Decides what new information to store in the cell state:
   i_t = sigmoid( W_i * [h_t-1, x_t] + b_i )
3. Output Gate (o_t): Controls what the next hidden state (h_t) should be:
   o_t = sigmoid( W_o * [h_t-1, x_t] + b_o )
The cell state is updated via addition (C_t = f_t * C_t-1 + i_t * C_tilde_t), which allows gradients to flow back with minimal attenuation.`,
    keywords: ["rnn", "lstm", "recurrent", "hidden state", "cell state", "forget gate", "vanishing gradient", "sequential"]
  },
  {
    id: "gan",
    category: "networks",
    title: "Generative Adversarial Networks (GANs)",
    summary: "A framework where two neural networks (Generator and Discriminator) are trained simultaneously in a zero-sum game.",
    details: `GANs consist of two competing sub-networks:
1. Generator (G): Takes a random noise vector z from a latent space and attempts to generate highly realistic synthetic data (G(z)).
2. Discriminator (D): Takes an input (either real from the dataset or fake from G) and outputs the probability that it is real (D(x)).
Objective Function:
They are trained together in a minimax game:
   min_G max_D V(D, G) = E_x[log D(x)] + E_z[log(1 - D(G(z)))]
- D tries to maximize V (accurately classify real vs fake).
- G tries to minimize V (force D(G(z)) close to 1).
Challenge:
GANs are highly sensitive to training dynamics, risking Mode Collapse (where the generator produces only a limited set of repetitive patterns). This is addressed by architectures like Wasserstein GAN (WGAN).`,
    keywords: ["gan", "generator", "discriminator", "minimax", "mode collapse", "latent space", "synthetic", "adversarial"]
  },
  {
    id: "gnn",
    category: "networks",
    title: "Graph Neural Networks (GNNs)",
    summary: "Networks designed to operate directly on graphs, learning representation embeddings for nodes, edges, and graphs as a whole.",
    details: `GNNs capture topological structures and relations. Traditional networks assume grid data (CNNs) or sequences (RNNs); graphs have arbitrary sizes and unordered neighborhoods.
Core Mechanism (Message Passing):
In each layer, nodes aggregate feature information from their immediate neighbors to update their own state:
1. Aggregate: Collect features from local neighbors:
   m_v^(k) = AGGREGATE^(k)( { h_u^(k-1) : u ∈ N(v) } )
   where N(v) is the set of neighbors of node v, and the aggregation function must be permutation-invariant (e.g., Sum, Mean, Max).
2. Combine: Update node features using its previous state and the aggregated message:
   h_v^(k) = COMBINE^(k)( h_v^(k-1), m_v^(k) )
After K iterations, a node's embedding represents the structural features within its K-hop neighborhood. Used in molecular design, recommendation engines, and social network analysis.`,
    keywords: ["gnn", "graph", "message passing", "aggregation", "neighbor", "topology", "relational", "node embedding"]
  },

  // --- MACHINE LEARNING ALGORITHMS ---
  {
    id: "supervised-basics",
    category: "algorithms",
    title: "Supervised Learning, Generalization & Regularization",
    summary: "The fundamentals of supervised predictive modeling, managing the bias-variance tradeoff, and enforcing constraints to prevent overfitting.",
    details: `Supervised learning builds mapping functions from labeled inputs: Y = f(X) + ε.
Core Concepts:
1. Overfitting vs. Underfitting:
   - Underfitting (High Bias): The model is too simple to capture the underlying patterns in the training data.
   - Overfitting (High Variance): The model captures training noise, failing to generalize to unseen test data.
2. Regularization: Adds a penalty term to the loss function to constrain model complexity:
   - L1 Regularization (Lasso): Penalty = λ * sum(|w|). Enforces sparsity, driving some weight coefficients to exactly zero (useful for feature selection).
   - L2 Regularization (Ridge): Penalty = λ * sum(w^2). Prevents individual weights from growing excessively large, smoothing model curves.
   - Elastic Net: Combines L1 and L2 penalties.`,
    keywords: ["supervised", "overfitting", "underfitting", "regularization", "lasso", "ridge", "bias", "variance", "generalization"]
  },
  {
    id: "ensemble-methods",
    category: "algorithms",
    title: "Ensemble Methods: Bagging, Boosting & XGBoost",
    summary: "Techniques combining multiple weak estimators (usually decision trees) into a single strong model to maximize predictive accuracy.",
    details: `Ensemble methods improve robust predictive power by aggregating predictions.
Two main paradigms:
1. Bagging (Bootstrap Aggregating):
   Trains multiple estimators in parallel on independent random bootstrapped samples of the dataset. Final prediction is the average (regression) or majority vote (classification).
   - Random Forest: Extends bagging by training decision trees while selecting a random subset of features at each node split, reducing tree correlation and variance.
2. Boosting:
   Trains estimators sequentially. Each new model is trained to correct the errors (residuals) of the cumulative ensemble.
   - Gradient Boosting: Uses gradient descent to minimize loss when adding trees.
   - XGBoost (Extreme Gradient Boosting): Highly optimized implementation of gradient boosting with L1/L2 regularization on trees, parallel tree construction, and cache-aware out-of-core calculations.`,
    keywords: ["ensemble", "bagging", "boosting", "random forest", "xgboost", "gradient boosting", "weak learner", "decision tree"]
  },
  {
    id: "svm",
    category: "algorithms",
    title: "Support Vector Machines (SVM) & Kernel Trick",
    summary: "A classification algorithm that finds the optimal hyperplane maximizing the margin between data classes, using kernels for non-linear boundaries.",
    details: `SVM aims to find the maximum-margin separating hyperplane in a feature space.
Key Concepts:
1. Hyperplane: Defined by w^T * x + b = 0.
2. Margin: The distance between the hyperplane and the closest training points (Support Vectors). SVM maximizes this margin.
3. Soft Margin (C parameter): Allows a controlled amount of training errors on noisy data to achieve a wider, more general margin.
4. The Kernel Trick: For datasets that are not linearly separable in their original space, SVM maps the inputs to a much higher-dimensional space where they become separable. Instead of explicitly calculating high-dimensional coordinates, it uses a Kernel Function:
   K(x, x') = <phi(x), phi(x')>
   - Linear Kernel: K(x, x') = x^T * x'
   - Radial Basis Function (RBF) Kernel: K(x, x') = exp(-gamma * ||x - x'||^2)`,
    keywords: ["svm", "support vector", "hyperplane", "margin", "kernel", "rbf", "kernel trick", "separator"]
  },
  {
    id: "clustering",
    category: "algorithms",
    title: "Unsupervised Clustering: K-Means, DBSCAN & Hierarchical",
    summary: "Algorithms grouping unlabeled data into coherent subsets based on metric distances, density, or hierarchies.",
    details: `Clustering identifies natural groupings in data without labels.
Key Algorithms:
1. K-Means: Iterative centroid assignment.
   - Step 1: Initialize K cluster centroids randomly.
   - Step 2: Assign each data point to its nearest centroid (Euclidean distance).
   - Step 3: Recalculate centroids as the mean of all points assigned to them.
   - Repeat steps 2 & 3 until centroids stabilize.
   - Limitation: Requires specifying K in advance; assumes spherical, even-sized clusters.
2. DBSCAN (Density-Based Spatial Clustering of Applications with Noise):
   Identifies clusters as continuous high-density regions separated by low-density regions.
   - Core Points: Have at least MinPts neighbors within an epsilon radius (eps).
   - Border Points: Fall within eps of a core point but have fewer than MinPts.
   - Noise: All other points.
   - Advantage: Discovers arbitrary-shaped clusters; doesn't require K; isolates outliers.
3. Hierarchical Clustering: Creates a dendrogram tree of data groupings either bottom-up (Agglomerative) or top-down (Divisive).`,
    keywords: ["clustering", "kmeans", "dbscan", "hierarchical", "unsupervised", "centroid", "dendrogram", "outliers"]
  },
  {
    id: "dimension-reduction",
    category: "algorithms",
    title: "Dimensionality Reduction: PCA, t-SNE & UMAP",
    summary: "Techniques for mapping high-dimensional feature spaces down to low-dimensional structures while preserving variance or local topology.",
    details: `High-dimensional data suffers from the 'Curse of Dimensionality'. Dimensionality reduction compacts features for computation or visualization.
Methods:
1. Principal Component Analysis (PCA):
   A linear technique that projects data onto orthogonal directions of maximum variance (Principal Components). It is computed using Singular Value Decomposition (SVD) of the data covariance matrix. It preserves global structures but fails on highly non-linear manifolds.
2. t-SNE (t-Distributed Stochastic Neighbor Embedding):
   A non-linear, probabilistic technique designed for visualization. It models pairwise similarities between points in the high-dimensional space as probabilities, maps them to low-dimensional coordinates, and minimizes the Kullback-Leibler (KL) divergence between high- and low-dimensional probability maps.
   - It prioritizes preserving local neighbors (clusters) over global arrangements.
3. UMAP (Uniform Manifold Approximation and Projection):
   A non-linear technique grounded in Riemannian geometry. It preserves both local structures and global topology better than t-SNE, while being significantly faster.`,
    keywords: ["pca", "tsne", "umap", "dimensionality reduction", "svd", "variance", "manifold", "local structure"]
  },

  // --- NLP ---
  {
    id: "tokenization",
    category: "nlp",
    title: "Tokenization & Preprocessing in NLP",
    summary: "The mechanisms used to break down raw text strings into discrete numerical IDs that models can ingest, using subword vocabularies.",
    details: `Modern NLP models cannot process characters or raw strings directly; they rely on tokenization.
Evolution of Tokenization:
1. Word-level: Splits on whitespace and punctuation. Weakness: Massive vocabulary sizes and unable to handle Out-of-Vocabulary (OOV) words (e.g., typos, extensions).
2. Character-level: Very small vocabulary, but sequences become extremely long, exceeding context lengths and diluting semantic signals.
3. Subword Tokenization (Industry Standard):
   Breaks common words into base roots and suffixes, allowing unseen or complex words to be parsed into recognizable segments.
   - Byte-Pair Encoding (BPE): Starts with character vocabulary. Iteratively merges the most frequent adjacent byte/character pairs in a corpus until the target vocabulary size is reached. (Used by GPT models).
   - WordPiece: Similar to BPE, but selects candidate merges by maximizing the likelihood of the language model training data (used by BERT).
   - SentencePiece: Operates directly on raw byte streams without requiring pre-tokenization whitespace, treating spaces as a meta-character (used by T5 and Llama).`,
    keywords: ["tokenization", "bpe", "wordpiece", "sentencepiece", "vocabulary", "preprocessing", "subword", "out of vocabulary"]
  },
  {
    id: "word-embeddings",
    category: "nlp",
    title: "Word Representations & Dense Semantic Embeddings",
    summary: "The representation of word meaning as dense, low-dimensional continuous vector spaces, from Word2Vec to contextual embeddings.",
    details: `Word representations capture lexical semantics in geometric space.
1. One-Hot Encoding: Represents words as sparse binary vectors of vocabulary size V. Cons: Vectors are orthogonal; no relationship information is preserved.
2. Static Dense Embeddings (Word2Vec, GloVe):
   Represent words as dense vectors of length D (usually 300).
   - Word2Vec: Grounded in the Distributional Hypothesis ('words that occur in similar contexts tend to have similar meanings'). Uses Skip-Gram (predicting context words given a target) or CBOW (predicting target word given context) models.
   Preserves algebraic analogies:
   Vector('King') - Vector('Man') + Vector('Woman') ≈ Vector('Queen')
   - Limitation: Words have single, static vectors. It cannot handle polysemy (e.g., 'bank' as a river side vs. 'bank' as a financial institution).
3. Contextual Embeddings:
   LLMs generate token vectors dynamically based on surrounding tokens using bidirectional self-attention (Transformers), solving polysemy completely.`,
    keywords: ["embeddings", "word2vec", "glove", "cosine distance", "dense vector", "semantic", "polysemy", "representation"]
  },
  {
    id: "bert-gpt",
    category: "nlp",
    title: "Encoder vs. Decoder Models: BERT vs. GPT",
    summary: "The architectural divergence in transformer usage, contrasting bidirectional autoencoders with autoregressive decoder language models.",
    details: `Modern language models split into two main pre-training paths:
1. BERT (Bidirectional Encoder Representations from Transformers):
   - Architecture: Encoder-only.
   - Pre-training Objective: Masked Language Modeling (MLM). Tokens in a sentence are randomly masked (15%), and the model must predict them using surrounding context from both left and right (bidirectional).
   - Use Case: Highly effective for extraction, classification, search, and reading comprehension where full sequence context is available.
2. GPT (Generative Pre-trained Transformer):
   - Architecture: Decoder-only.
   - Pre-training Objective: Causal Language Modeling (CLM). The model must predict the next token given preceding context (left-to-right autoregressive). Masked self-attention prevents attending to future tokens.
   - Use Case: Natural, fluent text generation, conversational interactions, and creative reasoning.`,
    keywords: ["bert", "gpt", "encoder", "decoder", "autoregressive", "bidirectional", "masked language modeling", "causal"]
  },
  {
    id: "ner-extraction",
    category: "nlp",
    title: "Named Entity Recognition & Information Extraction",
    summary: "Extracting structured facts, relationships, and entities (people, dates, places) from unstructured text strings.",
    details: `Information Extraction converts raw text into structured schemas or knowledge graphs.
Named Entity Recognition (NER):
Classifies tokens into pre-defined labels (e.g., PER, ORG, LOC, DATE).
- Tagging Schema: BIO (Begin, Inside, Outside) represents multi-token entities:
  'Apple' (B-ORG) 'Inc.' (I-ORG) 'is' (O) 'in' (O) 'Cupertino' (B-LOC).
- Modeling Patterns:
  - Sequence Labeling: Feeding token representation states from BERT into a Linear layer + Softmax to classify each token.
  - Linear Chain CRF (Conditional Random Fields): Adds sequence-level transition rules to ensure logical labeling (e.g., preventing I-ORG from directly following B-LOC).
  - Generative Extraction: Prompting decoders (like Gemini) with strict JSON Schemas to extract entities natively in a single generation step.`,
    keywords: ["ner", "information extraction", "bio tagging", "crf", "sequence labeling", "entity", "schema"]
  }
];

export function queryKnowledgeBase(queryStr: string, limitCount = 2): KnowledgeEntry[] {
  const normalizedQuery = queryStr.toLowerCase();
  
  // Calculate a simple match score based on keyword hits and title/summary overlap
  const scored = KNOWLEDGE_BASE.map(entry => {
    let score = 0;
    
    // Check keywords (high value)
    entry.keywords.forEach(kw => {
      if (normalizedQuery.includes(kw)) {
        score += 3;
      }
    });
    
    // Check title matches
    if (entry.title.toLowerCase().includes(normalizedQuery)) {
      score += 5;
    }
    
    // Word-by-word intersection with summary and description
    const queryWords = normalizedQuery.split(/\s+/).filter(w => w.length > 3);
    queryWords.forEach(word => {
      if (entry.summary.toLowerCase().includes(word)) {
        score += 1;
      }
      if (entry.details.toLowerCase().includes(word)) {
        score += 0.5;
      }
    });
    
    return { entry, score };
  });
  
  // Filter out zero-score matches, sort descending, and take the top K
  return scored
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .map(item => item.entry)
    .slice(0, limitCount);
}
