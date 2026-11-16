package com.romo.wellness;

import android.appwidget.AppWidgetManager;
import android.content.ComponentName;
import android.content.Intent;
import android.os.Bundle;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(RomoFileSaverPlugin.class);
        super.onCreate(savedInstanceState);
    }

    @Override
    public void onResume() {
        super.onResume();

        Intent widgetIntent =
            new Intent(AppWidgetManager.ACTION_APPWIDGET_UPDATE);

        int[] widgetIds = AppWidgetManager
            .getInstance(this)
            .getAppWidgetIds(
                new ComponentName(this, RomoWidget.class)
            );

        widgetIntent.putExtra(
            AppWidgetManager.EXTRA_APPWIDGET_IDS,
            widgetIds
        );

        sendBroadcast(widgetIntent);
    }
}
