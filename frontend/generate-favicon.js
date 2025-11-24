import { generateFaviconFiles, generateFaviconHtml } from '@realfavicongenerator/generate-favicon';
import { getNodeImageAdapter, loadAndConvertToSvg } from "@realfavicongenerator/image-adapter-node";
import { writeFile, mkdir } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function generateFavicons() {
  try {
    console.log('🚀 Starting favicon generation...');
    
    const imageAdapter = await getNodeImageAdapter();
    
    // Load the master icon - using your original BudgetBites logo
    const masterIcon = {
      icon: await loadAndConvertToSvg(join(__dirname, 'src', 'assets', 'BudgetBitesLogo.png')),
    };
    
    // Configure favicon settings
    const faviconSettings = {
      icon: {
        desktop: {
          regularIconTransformation: {
            type: 'none',
          },
          darkIconType: 'regular',
          darkIconTransformation: {
            type: 'none',
          },
        },
        touch: {
          transformation: {
            type: 'none',
          },
          appTitle: 'BudgetBites'
        },
        webAppManifest: {
          transformation: {
            type: 'none',
          },
          backgroundColor: '#09090b',
          themeColor: '#10b981',
          name: 'BudgetBites',
          shortName: 'BudgetBites',
          display: 'standalone',
        }
      },
      path: '/',
    };
    
    console.log('🎨 Generating favicon files...');
    const filesResult = await generateFaviconFiles(masterIcon, faviconSettings, imageAdapter);
    
    // Save all generated files
    const outputDir = join(__dirname, 'public');
    for (const [fileName, fileContent] of Object.entries(filesResult)) {
      const filePath = join(outputDir, fileName);
      await mkdir(dirname(filePath), { recursive: true });
      await writeFile(filePath, fileContent);
      console.log(`✅ Created: ${fileName}`);
    }
    
    console.log('📝 Generating HTML...');
    const htmlResult = await generateFaviconHtml(faviconSettings);
    
    // HTML result might be a string, array, or object
    let htmlString;
    if (Array.isArray(htmlResult)) {
      htmlString = htmlResult.join('\n');
    } else if (typeof htmlResult === 'string') {
      htmlString = htmlResult;
    } else if (typeof htmlResult === 'object') {
      htmlString = JSON.stringify(htmlResult, null, 2);
    } else {
      htmlString = String(htmlResult);
    }
    
    // Save HTML snippets to a file for reference
    const htmlPath = join(__dirname, 'favicon-html.txt');
    await writeFile(htmlPath, htmlString);
    console.log(`✅ HTML snippets saved to: favicon-html.txt`);
    
    console.log('\n🎉 Favicon generation complete!');
    console.log('\n📋 Next steps:');
    console.log('1. Copy the HTML from favicon-html.txt');
    console.log('2. Paste it into the <head> section of index.html');
    console.log('\nOr add this to your index.html <head>:\n');
    console.log(htmlString);
    
  } catch (error) {
    console.error('❌ Error generating favicons:', error);
    process.exit(1);
  }
}

generateFavicons();
