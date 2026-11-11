package com.romo.wellness;

import com.getcapacitor.BridgeActivity;
import android.appwidget.AppWidgetManager;
import android.content.ComponentName;
import android.content.Intent;

public class MainActivity extends BridgeActivity {
  @Override
  public void onResume() {
    super.onResume();
    Intent wi = new Intent(AppWidgetManager.ACTION_APPWIDGET_UPDATE);
    wi.putExtra(AppWidgetManager.EXTRA_APPWIDGET_IDS, AppWidgetManager.getInstance(this).getAppWidgetIds(new ComponentName(this, RomoWidget.class)));
    sendBroadcast(wi);
  }}
