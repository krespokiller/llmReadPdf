# RAG PDF Summarizer

Un sistema RAG (Retrieval-Augmented Generation) completo para procesar y resumir documentos PDF utilizando embeddings locales y modelos de lenguaje.

## 📋 Descripción

Este proyecto implementa un pipeline RAG completo que permite:

- **Lectura y procesamiento de PDFs**: Extrae texto de documentos PDF
- **Chunking inteligente**: Divide el contenido en fragmentos superpuestos para mejor recuperación
- **Embeddings locales**: Genera vectores de embeddings usando Hugging Face Transformers localmente
- **Búsqueda por similitud**: Encuentra fragmentos relevantes usando similitud coseno
- **Generación de respuestas**: Utiliza LLMs para generar respuestas basadas en el contexto recuperado

## 🏗️ Arquitectura

```
PDF → Chunking → Embeddings → Vector Store → Query → Similarity Search → LLM → Response
```

### Componentes principales:

1. **`pdfReader.js`** - Lectura y extracción de texto de archivos PDF
2. **`chunker.js`** - División del texto en fragmentos superpuestos
3. **`embeddings.js`** - Generación de embeddings usando Hugging Face Transformers
4. **`retrieval.js`** - Búsqueda por similitud y consultas RAG
5. **`index.js`** - Orquestador principal del pipeline

## 🚀 Instalación

### Prerrequisitos

- Node.js (versión 14 o superior)
- npm o yarn

### Pasos de instalación

1. **Clonar el repositorio**
   ```bash
   git clone <repository-url>
   cd prueba-tecnica-llm-read-pdf
   ```

2. **Instalar dependencias**
   ```bash
   npm install
   ```

3. **Configurar variables de entorno**
   ```bash
   cp .env.example .env
   ```
   
   Editar el archivo `.env` y agregar tu API key de OpenRouter:
   ```
   OPENROUTER_API_KEY=tu_api_key_aqui
   ```

## ⚙️ Configuración

### Variables de entorno

- `OPENROUTER_API_KEY`: Tu API key de OpenRouter para acceder a los modelos LLM

### Configuración de embeddings

El sistema utiliza el modelo `Xenova/all-MiniLM-L6-v2` de Hugging Face:
- **Dimensiones**: 384
- **Procesamiento**: Local (sin necesidad de API externa)
- **Tamaño de lote**: 32 chunks por lote

### Configuración de chunking

- **Tamaño de chunk**: 500 palabras (configurable)
- **Solapamiento**: 50 palabras entre chunks
- **Validación**: Chunks con más de 5 palabras

## 🎯 Uso

### Ejecución básica

```bash
npm start
```

### Flujo de trabajo

1. **Lectura del PDF**: El sistema lee el archivo PDF desde `./assets/prueba_tecnica_platzi.pdf`
2. **Chunking**: Divide el contenido en fragmentos superpuestos
3. **Generación de embeddings**: Crea vectores para cada fragmento
4. **Consulta RAG**: Procesa la consulta y genera una respuesta

### Ejemplo de salida

```
RAG PDF Summarizer started
Step 1: Reading and chunking PDF file...
✓ PDF chunked into 15 chunks
Step 2: Generating embeddings for chunks...
✓ Generated embeddings for 15 chunks
Step 3: Performing RAG query for summarization...
✓ RAG query completed successfully

==================================================
RAG RESPONSE:
==================================================
Answer: [Respuesta generada por el LLM]
Sources used: 3
Model used: openai/gpt-oss-20b:free
==================================================
```

## 📁 Estructura del proyecto

```
prueba-tecnica-llm-read-pdf/
├── assets/
│   └── prueba_tecnica_platzi.pdf    # Archivo PDF de ejemplo
├── chunker.js                       # Lógica de chunking
├── embeddings.js                    # Generación de embeddings
├── index.js                         # Punto de entrada principal
├── pdfReader.js                     # Lectura de PDFs
├── retrieval.js                     # Búsqueda y consultas RAG
├── package.json                     # Dependencias y scripts
└── README.md                        # Este archivo
```

## 🔧 Dependencias

### Principales

- **`@xenova/transformers`**: Modelos de Hugging Face para embeddings locales
- **`pdf-parse`**: Extracción de texto de archivos PDF
- **`dotenv`**: Gestión de variables de entorno

### APIs externas

- **OpenRouter**: Para acceso a modelos LLM (GPT-OSS-20B)

## 🎛️ Personalización

### Modificar parámetros de chunking

```javascript
const chunks = await chunkPdfContent(pdfPath, {
  chunkSize: 300,  // Palabras por chunk
  overlap: 30      // Palabras de solapamiento
});
```

### Cambiar modelo de embeddings

```javascript
// En embeddings.js
const EMBEDDING_MODEL = 'Xenova/all-MiniLM-L6-v2'; // Cambiar por otro modelo
```

### Ajustar número de chunks recuperados

```javascript
const ragResponse = await ragQuery(query, embeddingStore, apiKey, {
  topK: 5  // Recuperar top 5 chunks más relevantes
});
```

## 🐛 Solución de problemas

### Error: "OPENROUTER_API_KEY environment variable is required"

- Verifica que el archivo `.env` existe y contiene la API key
- Asegúrate de que la variable esté correctamente configurada

### Error: "File not found"

- Verifica que el archivo PDF existe en la ruta especificada
- Comprueba los permisos de lectura del archivo

### Error: "Invalid embedding dimensions"

- El modelo de embeddings puede haber cambiado
- Verifica la configuración en `embeddings.js`

### Rendimiento lento

- Reduce el tamaño de los chunks
- Aumenta el tamaño de lote en `MAX_BATCH_SIZE`
- Considera usar un modelo de embeddings más pequeño

## 📊 Métricas y monitoreo

El sistema proporciona logging detallado:

- Número de chunks generados
- Progreso de generación de embeddings
- Similitudes calculadas para cada chunk
- Uso de tokens del LLM
- Tiempo de procesamiento

## 🔒 Seguridad

- Las API keys se manejan a través de variables de entorno
- Los embeddings se procesan localmente (sin envío a APIs externas)
- Solo el texto de los chunks se envía al LLM

## 🤝 Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit tus cambios (`git commit -am 'Agregar nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia ISC. Ver el archivo `package.json` para más detalles.

## 🙏 Agradecimientos

- **Hugging Face** por los modelos de embeddings
- **OpenRouter** por el acceso a modelos LLM
- **Xenova** por la implementación de Transformers.js

---

**Nota**: Este proyecto fue desarrollado como parte de una prueba técnica para demostrar capacidades de RAG con procesamiento local de embeddings.
