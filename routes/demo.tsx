import { Head } from "$fresh/runtime.ts";
import { Button } from "../components/Button.tsx";

export default function Demo() {
  return (
    <>
      <Head>
        <title>Audio Button Demo</title>
        <style>
          {`
            body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                max-width: 800px;
                margin: 0 auto;
                padding: 20px;
                line-height: 1.6;
            }

            .demo-section {
                margin: 40px 0;
                padding: 20px;
                border: 1px solid #e0e0e0;
                border-radius: 8px;
            }

            h1 {
                color: #2c3e50;
                text-align: center;
            }

            h2 {
                color: #34495e;
                margin-top: 30px;
            }

            .demo-button {
                padding: 12px 24px;
                background-color: #4A90E2;
                color: white;
                border: none;
                border-radius: 4px;
                cursor: pointer;
                margin: 10px 0;
            }

            .config-example {
                background-color: #f8f9fa;
                padding: 15px;
                border-radius: 4px;
                margin: 10px 0;
                font-family: monospace;
            }

            .color-demo {
                display: flex;
                gap: 20px;
                margin: 20px 0;
            }

            .size-demo {
                display: flex;
                gap: 20px;
                margin: 20px 0;
            }

            @media (prefers-color-scheme: dark) {
                body {
                    background-color: #1a1a1a;
                    color: #fff;
                }

                .demo-section {
                    border-color: #333;
                }

                h1, h2 {
                    color: #fff;
                }

                .config-example {
                    background-color: #2a2a2a;
                    color: #fff;
                }
            }
          `}
        </style>
        <script type="module" src="/audio-button.min.js" />
        <script type="module">
          {`
            import { AudioButton } from '/audio-button.min.js';
            document.addEventListener('DOMContentLoaded', () => {
              // Initialize the replacement button
              new AudioButton({
                  id: 'replace-target',
                  color: '#4A90E2',
                  size: 'medium'
              });
            });
          `}
        </script>
      </Head>
      <div>
        <h1>Audio Button Demo</h1>

        <div class="demo-section">
          <h2>Script Tag Implementation</h2>
          <p>Include the audio button component in your project using one of these script tags:</p>

          <div class="config-example">
            <pre>
              {`{/* Minified version */}
<script type="module" src="/audio-button.min.js" />

{/* Development version */}
<script type="module" src="/audio-button.ts" />`}
            </pre>
          </div>

          <p>Then initialize the button with your desired configuration:</p>
          <div class="config-example">
            <pre>const button = new AudioButton({"{"}
              id: 'my-button',      {/* Optional: Replace existing element */}
              color: '#4A90E2',     {/* Custom color */}
              size: 'medium',       {/* small, medium, or large */}
              position: 'bottom-right'  {/* bottom-right, bottom-left, top-right, top-left */}
              {"}"});</pre>
          </div>
        </div>

        <div class="demo-section">
          <h2>Standalone Floating Button</h2>
          <p>The default audio button appears in the bottom-right corner of the page. You can customize its appearance using URL parameters:</p>

          <div class="config-example">
            ?color=#FF5733&size=large&position=bottom-left
          </div>

          <h3>Color Variations</h3>
          <div class="color-demo">
            <audio-button id="red-button" color="#FF5733"></audio-button>
            <audio-button id="green-button" color="#33FF57"></audio-button>
            <audio-button id="blue-button" color="#3357FF"></audio-button>
          </div>

          <h3>Size Variations</h3>
          <div class="size-demo">
            <audio-button id="small-button" size="small"></audio-button>
            <audio-button id="medium-button" size="medium"></audio-button>
            <audio-button id="large-button" size="large"></audio-button>
          </div>
        </div>

        <div class="demo-section">
          <h2>Element Replacement</h2>
          <p>You can replace any element with an audio button by specifying its ID:</p>

          <div class="config-example">
            <pre>const button = new AudioButton({"{"}
              id: 'my-button',
              color: '#4A90E2',
              size: 'medium'
              {"}"});</pre>
          </div>

          <Button id="replace-target" class="demo-button">Replace this button</Button>
        </div>

        <script type="module">
          {`
            document.addEventListener('DOMContentLoaded', () => {
              // Initialize the replacement button
              new AudioButton({
                  id: 'replace-target',
                  color: '#4A90E2',
                  size: 'medium'
              });
            });
          `}
        </script>
      </div>
    </>
  );
}