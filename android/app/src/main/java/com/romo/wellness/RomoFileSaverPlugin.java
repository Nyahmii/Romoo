package com.romo.wellness;

import android.app.Activity;
import android.content.Intent;
import android.net.Uri;
import android.provider.DocumentsContract;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.ActivityCallback;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.io.OutputStream;
import java.nio.charset.StandardCharsets;

@CapacitorPlugin(name = "RomoFileSaver")
public class RomoFileSaverPlugin extends Plugin {

    @PluginMethod
    public void saveTextFile(PluginCall call) {
        String filename = call.getString("filename");
        String content = call.getString("content");
        String mimeType = call.getString("mimeType", "text/plain");

        if (filename == null || filename.trim().isEmpty()) {
            call.reject("A filename is required.");
            return;
        }

        if (content == null) {
            call.reject("File content is required.");
            return;
        }

        Intent intent = new Intent(Intent.ACTION_CREATE_DOCUMENT);
        intent.addCategory(Intent.CATEGORY_OPENABLE);
        intent.setType(mimeType);
        intent.putExtra(Intent.EXTRA_TITLE, filename);

        startActivityForResult(call, intent, "saveTextFileResult");
    }

    @ActivityCallback
    private void saveTextFileResult(
        PluginCall call,
        androidx.activity.result.ActivityResult result
    ) {
        if (call == null) {
            return;
        }

        if (result.getResultCode() != Activity.RESULT_OK) {
            call.reject("Save cancelled.");
            return;
        }

        Intent data = result.getData();

        if (data == null || data.getData() == null) {
            call.reject("Android did not return a save location.");
            return;
        }

        Uri uri = data.getData();
        String content = call.getString("content", "");

        try (
            OutputStream output =
                getContext().getContentResolver().openOutputStream(uri, "wt")
        ) {
            if (output == null) {
                call.reject("Android could not open the selected location.");
                return;
            }

            output.write(content.getBytes(StandardCharsets.UTF_8));
            output.flush();

            JSObject response = new JSObject();
            response.put("uri", uri.toString());

            String displayName =
                DocumentsContract.getDocumentId(uri);

            response.put("filename", displayName);
            call.resolve(response);
        } catch (Exception error) {
            call.reject("Could not save ROMO backup.", error);
        }
    }
}
