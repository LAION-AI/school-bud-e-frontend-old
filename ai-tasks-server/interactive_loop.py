import time
import google.generativeai as genai

def interactive_loop():
    # -----------------------------
    # INTERACTIVE LOOP: TIME STEP ROLLOUT
    # -----------------------------
    print("\nEntering interactive loop for time step rollouts.")
    print("Type 'exit' or 'quit' to stop.")

    generation_config = {
        "temperature": 1,
        "top_p": 0.95,
        "top_k": 40,
        "max_output_tokens": 8192,
        "response_mime_type": "text/plain",
    }
    genai.configure(api_key="")

    gemini_model = genai.GenerativeModel(
        model_name="gemini-2.5-flash-online",
        generation_config=generation_config,
    )

    # Attempt to start a Gemini chat session
    try:
        gemini_chat_session = gemini_model.start_chat(
            history=[
                {
                    "role": "user",
                    "parts": [
                        "You are a creative simulation storyteller. Your task is to generate the next time step of a world simulation game. The output must be in XML format and include narrative text, <Audiobook Narration> blocks, and <IMAGE> tags as needed. Ensure the continuation is emotionally intelligent, interesting, and moves the plot forward."
                    ],
                }
            ]
        )
    except Exception as e:
        print(f"Error starting Gemini chat session: {e}")

    while True:
        user_input = input("\nEnter how you'd like the story to continue and what John should do: ")
        if user_input.strip().lower() in ['exit', 'quit']:
            print("Exiting simulation loop.")
            break

        prompt = (
            f"Current simulation:\n{current_simulation_text}\n\n"
            f"User instruction: {user_input}\n\n"
            "Please roll out the next time step of the simulation. Ensure the new section is emotionally intelligent, interesting, and moves the plot forward. Use the same XML format as before, including <Audiobook Narration> blocks and <IMAGE> tags for new scenes.  Make sure in the audiobook narration you do not nest any emotion text in themselves. So in each emotion tag you only have the text that has to be said but not another emotion tag. And when you generate images, image text, make sure that the description of the characters is very much on the point, very detailed about face and age and hair color and emotions and in accordance with the previous description of the character you are showing. Adhere exactly to the audiobook formatting rules."
        )

        retry_timeout = 1
        max_timeout = 60
        valid_response = None
        while True:
            try:
                print(f"\nSending prompt to Gemini API: {prompt}")
                response = gemini_chat_session.send_message(prompt)
                response_text = response.text.strip() if response.text else ""
                if len(response_text) >= 100:
                    valid_response = response_text
                    break
                else:
                    print(f"Received response is too short (length {len(response_text)}). Retrying in {retry_timeout} seconds...")
                    time.sleep(retry_timeout)
                    retry_timeout = min(retry_timeout * 2, max_timeout)
            except Exception as e:
                print(f"Error calling Gemini API: {e}. Retrying in {retry_timeout} seconds...")
                time.sleep(retry_timeout)
                retry_timeout = min(retry_timeout * 2, max_timeout)

        timestamp_str = time.strftime("%Y%m%d-%H%M%S")
        response_filename = f"gemini_response_{timestamp_str}.txt"
        with open(response_filename, "w", encoding="utf-8") as f:
            f.write(valid_response)
        print(f"Saved Gemini response to {response_filename}")

        print("\nGenerating and displaying the new audiobook segments from Gemini response...")
        generate_audiobook(valid_response)

        current_simulation_text += "\n" + valid_response

        print("\nTime step complete. The simulation has been updated with the new time step.")

    print("\nSimulation loop terminated. Script completed successfully.")
