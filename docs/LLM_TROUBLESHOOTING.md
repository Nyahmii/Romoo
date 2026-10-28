# 🤖 LLM Troubleshooting Guide

This guide helps you fix issues with the AI recipe generation feature in ROMO.

## Common Issues & Solutions

### Issue 1: WebLLM Not Working

**Symptoms:**
- "WebGPU is not supported on this device"
- Model fails to load
- No response or timeout

**Solutions:**

1. **Check Browser Compatibility**
   - WebLLM requires WebGPU support
   - Use **Chrome 113+** or **Edge 113+**
   - Firefox and Safari have limited WebGPU support
   - Check: https://webgpureport.org/

2. **Check Device Compatibility**
   - Requires a GPU with WebGPU support
   - Most devices from 2021+ should work
   - Older phones may not support WebGPU

3. **Clear Browser Cache**
   ```
   Chrome: Settings > Privacy > Clear browsing data
   Select "Cached images and files"
   ```

4. **Try a Different Model**
   - The app uses Phi-2 by default (smaller, more compatible)
   - If you have a powerful device, you can modify the code to use larger models

5. **Alternative: Use Ollama**
   - If WebLLM doesn't work on your device, switch to Ollama
   - See Ollama setup below

---

### Issue 2: Ollama Connection Failed

**Symptoms:**
- "Cannot reach Ollama"
- "Failed to fetch"
- "CORS error"

**Solutions:**

1. **Make Sure Ollama is Running**
   ```bash
   # Check if Ollama is running
   ollama list
   
   # If not running, start it
   ollama serve
   ```

2. **Enable CORS (Most Common Issue!)**
   
   Ollama blocks browser requests by default. You MUST enable CORS:
   
   **Linux/Mac:**
   ```bash
   OLLAMA_ORIGINS="*" ollama serve
   ```
   
   **Windows (Command Prompt):**
   ```cmd
   set OLLAMA_ORIGINS=*
   ollama serve
   ```
   
   **Windows (PowerShell):**
   ```powershell
   $env:OLLAMA_ORIGINS="*"
   ollama serve
   ```
   
   **Make it Permanent:**
   
   Linux/Mac - Add to `~/.bashrc` or `~/.zshrc`:
   ```bash
   export OLLAMA_ORIGINS="*"
   ```
   
   Windows - Add to Environment Variables:
   1. Search "Environment Variables" in Start menu
   2. Click "Edit the system environment variables"
   3. Click "Environment Variables" button
   4. Under "User variables", click "New"
   5. Name: `OLLAMA_ORIGINS`
   6. Value: `*`
   7. Click OK and restart your computer

3. **Pull a Model**
   ```bash
   # Pull a small, fast model
   ollama pull llama3.2
   
   # Or try these alternatives:
   ollama pull mistral
   ollama pull phi
   ollama pull gemma2
   ```

4. **Check the URL**
   - Default: `http://localhost:11434`
   - Make sure there's no trailing slash
   - If running on a different machine, use the IP address

5. **Test the Connection**
   ```bash
   # Test if Ollama is responding
   curl http://localhost:11434/api/tags
   ```
   
   You should see a JSON response with available models.

6. **Check Firewall**
   - Make sure your firewall isn't blocking port 11434
   - Try temporarily disabling firewall to test

---

### Issue 3: Empty or Poor Quality Responses

**Symptoms:**
- AI returns empty response
- Responses don't make sense
- Responses are incomplete

**Solutions:**

1. **Be More Specific in Your Prompt**
   ```
   ❌ Bad: "Give me a recipe"
   ✅ Good: "Create a vegetarian dinner recipe with spinach, quinoa, and tomatoes that takes 30 minutes"
   ```

2. **Use a Better Model**
   - Llama 3.2 is good for recipes
   - Mistral is also excellent
   - Phi is smaller but faster
   - Try: `ollama pull llama3.2`

3. **Check Model is Loaded**
   ```bash
   ollama list
   ```
   
   Make sure your model shows up in the list.

4. **Restart Ollama**
   ```bash
   # Stop Ollama (Ctrl+C)
   # Start again with CORS
   OLLAMA_ORIGINS="*" ollama serve
   ```

---

### Issue 4: Very Slow Responses

**Symptoms:**
- Takes forever to generate
- Times out

**Solutions:**

1. **Use a Smaller Model**
   ```bash
   ollama pull phi        # Smallest, fastest
   ollama pull gemma2     # Small, good quality
   ollama pull llama3.2   # Medium, good balance
   ```

2. **Close Other Applications**
   - Free up RAM and CPU
   - Close browser tabs
   - Close other apps

3. **For WebLLM:**
   - First load is slow (downloading model)
   - Subsequent uses are faster
   - Make sure you have good internet for initial download

4. **For Ollama:**
   - Make sure you have enough RAM (8GB+ recommended)
   - Check CPU usage
   - Consider using a GPU if available

---

## Testing Your Setup

### Test WebLLM

1. Open ROMO in Chrome
2. Go to Settings > AI & LLM Features
3. Enable "Local LLM"
4. Select "WebLLM"
5. Go to Recipes page
6. Click "Generate" under AI Recipe Generator
7. Watch the console for loading progress (F12 > Console)

**Expected:**
- Model downloads (~700MB, one time)
- "Initializing AI model..." message
- Recipe generates after 10-30 seconds

### Test Ollama

1. Start Ollama with CORS:
   ```bash
   OLLAMA_ORIGINS="*" ollama serve
   ```

2. Pull a model:
   ```bash
   ollama pull llama3.2
   ```

3. Test connection:
   ```bash
   curl http://localhost:11434/api/tags
   ```

4. In ROMO:
   - Go to Settings > AI & LLM Features
   - Enable "Local LLM"
   - Select "Ollama"
   - Set URL to `http://localhost:11434`
   - Go to Recipes page
   - Click "Test Connection"
   - Should show "Connected successfully"

5. Generate a recipe:
   - Enter a prompt
   - Click "Generate Recipe"
   - Should get a response in 5-15 seconds

---

## Advanced Troubleshooting

### Check Browser Console

1. Open DevTools (F12)
2. Go to Console tab
3. Look for error messages
4. Common errors:
   - `WebGPU not supported` → Use Ollama or different browser
   - `Failed to fetch` → Ollama not running or CORS issue
   - `CORS error` → Enable CORS in Ollama
   - `Model not found` → Pull the model with `ollama pull`

### Check Network Tab

1. Open DevTools (F12)
2. Go to Network tab
3. Try to generate a recipe
4. Look for failed requests
5. Check the response status and error messages

### Check Ollama Logs

```bash
# Ollama logs location:
# Linux: ~/.ollama/logs/
# Mac: ~/Library/Logs/Ollama/
# Windows: %LOCALAPPDATA%\Ollama\logs\
```

### Verify Model Compatibility

Not all Ollama models work well for recipes. Recommended models:
- ✅ `llama3.2` - Good balance of speed and quality
- ✅ `mistral` - Excellent for creative tasks
- ✅ `phi` - Small and fast
- ✅ `gemma2` - Good quality, smaller size
- ⚠️ `codellama` - Not optimized for recipes
- ❌ `llava` - Vision model, not needed

---

## Getting Help

If you're still having issues:

1. **Check the GitHub Issues**: https://github.com/YOUR_USERNAME/ROMO/issues
2. **Create a new issue** with:
   - Your device/browser info
   - Which LLM provider you're using
   - Error messages from console
   - Steps to reproduce

3. **Include this info:**
   ```
   Device: [phone model or computer specs]
   Browser: [Chrome/Firefox/Safari version]
   LLM Provider: [WebLLM/Ollama]
   Ollama Version: [if using Ollama]
   Error Message: [exact error from console]
   ```

---

## Quick Reference

### WebLLM Requirements
- Chrome 113+ or Edge 113+
- WebGPU support
- 2GB+ RAM available
- 700MB download (one time)

### Ollama Requirements
- Ollama installed and running
- CORS enabled: `OLLAMA_ORIGINS="*"`
- At least one model pulled
- 4GB+ RAM recommended
- URL: `http://localhost:11434`

### Quick Commands

```bash
# Start Ollama with CORS
OLLAMA_ORIGINS="*" ollama serve

# List available models
ollama list

# Pull a model
ollama pull llama3.2

# Test Ollama
curl http://localhost:11434/api/tags

# Check Ollama version
ollama --version
```

---

**Remember:** The LLM feature is completely optional! You can still use ROMO without it. The built-in recipe library works perfectly without any AI. 🦦
