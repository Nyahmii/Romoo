package com.romo.wellness;

import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.Context;
import android.content.Intent;
import android.app.PendingIntent;
import android.widget.RemoteViews;
import java.io.File;
import java.io.FileInputStream;
import org.json.JSONObject;
import org.json.JSONArray;

public class RomoWidget extends AppWidgetProvider {
    @Override
    public void onUpdate(Context context, AppWidgetManager mgr, int[] ids) {
        for (int id : ids) {
            RemoteViews v = new RemoteViews(context.getPackageName(), R.layout.widget_romo);
            try {
                File f = new File(context.getFilesDir(), "widget-snapshot.json");
                if (f.exists()) {
                    FileInputStream in = new FileInputStream(f);
                    byte[] b = new byte[(int) f.length()];
                    in.read(b); in.close();
                    JSONObject j = new JSONObject(new String(b, "UTF-8"));
                    JSONArray goals = j.optJSONArray("goals");
                    StringBuilder sb = new StringBuilder();
                    if (goals != null) {
                        for (int i = 0; i < goals.length() && i < 3; i++) {
                            JSONObject g = goals.getJSONObject(i);
                            sb.append(g.optString("pct")).append("%  ").append(g.optString("title")).append("\n");
                        }
                    }
                    if (sb.length() == 0) sb.append("No active goals 🌱");
                    v.setTextViewText(R.id.widget_goals, sb.toString());
                    v.setTextViewText(R.id.widget_footer, "🔥 " + j.optInt("streak") + " day streak   💊 " + j.optInt("medPct") + "% this week");
                }
            } catch (Exception e) {
                v.setTextViewText(R.id.widget_goals, "Open Romo to sync 🦦");
            }
            Intent open = context.getPackageManager().getLaunchIntentForPackage(context.getPackageName());
            PendingIntent pi = PendingIntent.getActivity(context, 0, open, PendingIntent.FLAG_IMMUTABLE);
            v.setOnClickPendingIntent(R.id.widget_root, pi);
            mgr.updateAppWidget(id, v);
        }
    }
}
