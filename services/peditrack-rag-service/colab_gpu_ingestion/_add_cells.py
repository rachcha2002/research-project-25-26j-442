"""
Replaces the old final 'Complete!' markdown cell with the new full set of cells:
  Step 9  – Save vector store
  Step 10 – 2D vector space visualization (UMAP)
  Step 11 – Per-dataset cluster facet plot
  Step 12 – Download everything
  Step 13 – Test retrieval
  Done     – instructions
"""
import json, pathlib

NB_PATH = pathlib.Path(__file__).parent / "GPU_Ingestion.ipynb"

with open(NB_PATH, encoding="utf-8") as f:
    nb = json.load(f)


def md(src: str) -> dict:
    return {"cell_type": "markdown", "metadata": {}, "source": src}


def code(src: str) -> dict:
    return {"cell_type": "code", "execution_count": None,
            "metadata": {}, "outputs": [], "source": src}


NEW_CELLS = [
    # ── Step 9: Save ──────────────────────────────────────────────────────────
    md("---\n## Step 9: Save Vector Store"),

    code(
        "import json\n"
        "\n"
        "faiss.write_index(index, 'faiss_index')\n"
        "print('✓ FAISS index saved')\n"
        "\n"
        "with open('metadata.json', 'w', encoding='utf-8') as f:\n"
        "    json.dump(metadata_list, f, ensure_ascii=False)\n"
        "print('✓ Metadata saved')\n"
        "\n"
        "print(f'\\nFiles created:')\n"
        "print(f'  faiss_index   — {index.ntotal} vectors')\n"
        "print(f'  metadata.json — {len(metadata_list)} entries')"
    ),

    # ── Step 10: 2D viz ───────────────────────────────────────────────────────
    md(
        "---\n"
        "## Step 10: 2D Vector Space Visualization\n"
        "\n"
        "**UMAP** projects the 384-dimensional embeddings down to 2 dimensions.\n"
        "Each dot is one document, coloured by dataset source.  \n"
        "Tight clusters = semantically similar content.  \n"
        "You can see exactly where the Sri Lanka datasets sit relative to the\n"
        "large remote medical datasets."
    ),

    code(
        "import numpy as np\n"
        "import matplotlib.pyplot as plt\n"
        "import seaborn as sns\n"
        "import umap\n"
        "from collections import Counter\n"
        "\n"
        "# ── 1. Extract all vectors from the FAISS index ─────────────────────\n"
        "total = index.ntotal\n"
        "print(f'Total vectors in index: {total}')\n"
        "\n"
        "all_vecs = np.zeros((total, embedding_dim), dtype='float32')\n"
        "for i in range(total):\n"
        "    all_vecs[i] = index.reconstruct(i)\n"
        "print('✓ Vectors extracted')\n"
        "\n"
        "# ── 2. Stratified sample (UMAP is O(n log n), slow for 46k+ pts) ────\n"
        "MAX_SAMPLE = 8000   # set to None to plot every point\n"
        "\n"
        "labels_arr = np.array(dataset_labels)\n"
        "if MAX_SAMPLE and total > MAX_SAMPLE:\n"
        "    rng = np.random.default_rng(42)\n"
        "    chosen = []\n"
        "    for lbl in set(dataset_labels):\n"
        "        idx = np.where(labels_arr == lbl)[0]\n"
        "        n   = max(1, int(MAX_SAMPLE * len(idx) / total))\n"
        "        chosen.extend(rng.choice(idx, size=min(n, len(idx)), replace=False).tolist())\n"
        "    chosen = np.array(chosen)\n"
        "    sample_vecs, sample_labels = all_vecs[chosen], labels_arr[chosen]\n"
        "    print(f'✓ Stratified sample: {len(chosen)} points')\n"
        "else:\n"
        "    sample_vecs, sample_labels = all_vecs, labels_arr\n"
        "    print(f'Using all {len(all_vecs)} points')\n"
        "\n"
        "# ── 3. UMAP 2D reduction ─────────────────────────────────────────────\n"
        "print('Running UMAP (1-2 min)...')\n"
        "reducer = umap.UMAP(n_components=2, n_neighbors=30, min_dist=0.1,\n"
        "                    metric='cosine', random_state=42, verbose=False)\n"
        "emb2d = reducer.fit_transform(sample_vecs)\n"
        "print('✓ UMAP complete')\n"
        "\n"
        "# ── 4. Plot ──────────────────────────────────────────────────────────\n"
        "unique_labels = sorted(set(sample_labels))\n"
        "palette   = sns.color_palette('tab20', n_colors=len(unique_labels))\n"
        "color_map = {lbl: palette[i] for i, lbl in enumerate(unique_labels)}\n"
        "\n"
        "fig, ax = plt.subplots(figsize=(14, 10))\n"
        "fig.patch.set_facecolor('#0f0f1a')\n"
        "ax.set_facecolor('#0f0f1a')\n"
        "\n"
        "for lbl in unique_labels:\n"
        "    mask = sample_labels == lbl\n"
        "    ax.scatter(emb2d[mask, 0], emb2d[mask, 1],\n"
        "               c=[color_map[lbl]], s=4, alpha=0.65, linewidths=0,\n"
        "               label=f'{lbl} ({mask.sum()})')\n"
        "\n"
        "ax.legend(loc='upper right', fontsize=8, framealpha=0.3,\n"
        "          facecolor='#1a1a2e', edgecolor='gray',\n"
        "          labelcolor='white', markerscale=3)\n"
        "n_datasets = len(unique_labels)\n"
        "n_pts      = len(sample_labels)\n"
        "ax.set_title(\n"
        "    f'PediTrack RAG — Vector Space (UMAP 2D)\\n'\n"
        "    f'{n_pts} sampled docs · {n_datasets} datasets',\n"
        "    color='white', fontsize=14, pad=14)\n"
        "ax.set_xlabel('UMAP-1', color='#aaaaaa', fontsize=10)\n"
        "ax.set_ylabel('UMAP-2', color='#aaaaaa', fontsize=10)\n"
        "ax.tick_params(colors='#666666')\n"
        "for spine in ax.spines.values():\n"
        "    spine.set_edgecolor('#333333')\n"
        "\n"
        "plt.tight_layout()\n"
        "plt.savefig('vector_space_2d.png', dpi=150, bbox_inches='tight',\n"
        "            facecolor=fig.get_facecolor())\n"
        "plt.show()\n"
        "print('✓ Saved vector_space_2d.png')"
    ),

    # ── Step 11: facet plot ───────────────────────────────────────────────────
    md(
        "---\n"
        "## Step 11: Per-Dataset Cluster Detail Plot\n"
        "\n"
        "Same 2D space as above, but each dataset gets its own subplot so you can\n"
        "read the clusters without dot overlap."
    ),

    code(
        "import math\n"
        "\n"
        "n_lbl = len(unique_labels)\n"
        "cols  = 4\n"
        "rows  = math.ceil(n_lbl / cols)\n"
        "\n"
        "fig2, axes = plt.subplots(rows, cols, figsize=(cols * 4.5, rows * 4))\n"
        "fig2.patch.set_facecolor('#0f0f1a')\n"
        "axes_flat = axes.flatten()\n"
        "\n"
        "# faint background of ALL points in every subplot\n"
        "for ax in axes_flat:\n"
        "    ax.set_facecolor('#0f0f1a')\n"
        "    ax.scatter(emb2d[:, 0], emb2d[:, 1],\n"
        "               c='#555555', s=1, alpha=0.15, linewidths=0)\n"
        "\n"
        "last_i = 0\n"
        "for i, lbl in enumerate(unique_labels):\n"
        "    ax = axes_flat[i]\n"
        "    mask = sample_labels == lbl\n"
        "    ax.scatter(emb2d[mask, 0], emb2d[mask, 1],\n"
        "               c=[color_map[lbl]], s=6, alpha=0.8, linewidths=0)\n"
        "    ax.set_title(f'{lbl}\\n({mask.sum()})', color='white', fontsize=8)\n"
        "    ax.tick_params(colors='#555555', labelsize=6)\n"
        "    for spine in ax.spines.values():\n"
        "        spine.set_edgecolor('#333333')\n"
        "    last_i = i\n"
        "\n"
        "for j in range(last_i + 1, len(axes_flat)):\n"
        "    axes_flat[j].set_visible(False)\n"
        "\n"
        "fig2.suptitle('PediTrack RAG — Per-Dataset Clusters (UMAP 2D)',\n"
        "              color='white', fontsize=13, y=1.01)\n"
        "plt.tight_layout()\n"
        "plt.savefig('vector_space_facets.png', dpi=150, bbox_inches='tight',\n"
        "            facecolor=fig2.get_facecolor())\n"
        "plt.show()\n"
        "print('✓ Saved vector_space_facets.png')"
    ),

    # ── Step 12: Download ─────────────────────────────────────────────────────
    md("---\n## Step 12: Download Everything"),

    code(
        "from google.colab import files\n"
        "import zipfile\n"
        "\n"
        "with zipfile.ZipFile('vector_store.zip', 'w', zipfile.ZIP_DEFLATED) as zf:\n"
        "    zf.write('faiss_index')\n"
        "    zf.write('metadata.json')\n"
        "    zf.write('vector_space_2d.png')\n"
        "    zf.write('vector_space_facets.png')\n"
        "\n"
        "print('✓ vector_store.zip created')\n"
        "files.download('vector_store.zip')\n"
        "print('✓ Download started')"
    ),

    # ── Step 13: Test retrieval ───────────────────────────────────────────────
    md("---\n## Step 13: Test Retrieval (Optional)"),

    code(
        "test_queries = [\n"
        "    'What are the symptoms of fever in children?',\n"
        "    'Sri Lanka exclusive breastfeeding recommendation',\n"
        "    'CHDR growth chart underweight assessment',\n"
        "    'Screen time limits for toddlers',\n"
        "    'Complementary feeding after 6 months Sri Lanka',\n"
        "]\n"
        "\n"
        "for query in test_queries:\n"
        "    q_emb = model.encode([query], convert_to_numpy=True).astype('float32')\n"
        "    dists, idxs = index.search(q_emb, k=3)\n"
        "    print(f'\\n🔍  {query}')\n"
        "    for rank, (dist, idx) in enumerate(zip(dists[0], idxs[0]), 1):\n"
        "        score = 1 / (1 + dist)\n"
        "        src   = metadata_list[idx]['source']\n"
        "        text  = metadata_list[idx]['text'][:150]\n"
        "        print(f'  #{rank}  score={score:.3f}  src={src}')\n"
        "        print(f'       {text}...')"
    ),

    # ── Done ──────────────────────────────────────────────────────────────────
    md(
        "---\n"
        "## Done!\n"
        "\n"
        "`vector_store.zip` contains:\n"
        "- `faiss_index` — FAISS binary index (all vectors)\n"
        "- `metadata.json` — text + source + metadata for every document\n"
        "- `vector_space_2d.png` — UMAP 2D overview plot\n"
        "- `vector_space_facets.png` — per-dataset facet grid\n"
        "\n"
        "**After downloading:**\n"
        "1. Extract to `services/peditrack-rag-service/vector_store/`\n"
        "2. Restart the RAG service — it will auto-load the new index\n"
        "3. Verify with `curl http://localhost:3002/api/rag/stats`"
    ),
]

# Drop the old final "Complete!" cell (index 18) and append new cells
nb["cells"] = nb["cells"][:18] + NEW_CELLS

with open(NB_PATH, "w", encoding="utf-8") as f:
    json.dump(nb, f, ensure_ascii=False, indent=1)

print(f"Done. Total cells: {len(nb['cells'])}")
