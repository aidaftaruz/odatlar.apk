package uz.diyor.odatlar;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.widget.RemoteViews;
import java.text.NumberFormat;
import java.util.Calendar;
import java.util.Locale;

/** Bosh ekran vidjeti: qadam, bugungi odatlar va kaloriya. */
public class OdatWidget extends AppWidgetProvider {
    static final String P = "odat_widget";
    private static final String[] WD = {"Ya", "Du", "Se", "Ch", "Pa", "Ju", "Sh"};
    private static final String[] MON = {"yan", "fev", "mar", "apr", "may", "iyun", "iyul", "avg", "sen", "okt", "noy", "dek"};

    @Override
    public void onUpdate(Context context, AppWidgetManager mgr, int[] ids) {
        for (int id : ids) mgr.updateAppWidget(id, build(context));
    }

    static void refreshAll(Context c) {
        try {
            AppWidgetManager mgr = AppWidgetManager.getInstance(c);
            int[] ids = mgr.getAppWidgetIds(new ComponentName(c, OdatWidget.class));
            if (ids == null || ids.length == 0) return;
            RemoteViews v = build(c);
            for (int id : ids) mgr.updateAppWidget(id, v);
        } catch (Exception ignored) {}
    }

    private static String n(long x) {
        return NumberFormat.getIntegerInstance(new Locale("ru")).format(x).replace(' ', ' ');
    }

    private static int pct(long a, long b) {
        return b <= 0 ? 0 : (int) Math.max(0, Math.min(100, a * 100 / b));
    }

    static RemoteViews build(Context c) {
        RemoteViews v = new RemoteViews(c.getPackageName(), R.layout.widget_odat);
        SharedPreferences sp = c.getSharedPreferences(P, Context.MODE_PRIVATE);
        String today = StepStore.day(System.currentTimeMillis());
        boolean fresh = today.equals(sp.getString("date", ""));
        Calendar cal = Calendar.getInstance();
        v.setTextViewText(R.id.w_date, WD[cal.get(Calendar.DAY_OF_WEEK) - 1] + ", " + cal.get(Calendar.DAY_OF_MONTH) + "-" + MON[cal.get(Calendar.MONTH)]);

        // Qadam: ilova yuborgan son + shundan beri sensor qo'shgani
        long goal = sp.getLong("stepGoal", 10000);
        long walkNow = StepStore.walkOn(c, today);
        long steps = fresh ? sp.getLong("steps", 0) + Math.max(0, walkNow - sp.getLong("walkAt", 0)) : walkNow;
        v.setTextViewText(R.id.w_steps_val, n(steps) + " / " + n(goal));
        v.setProgressBar(R.id.w_steps_bar, 100, pct(steps, goal), false);

        // Odatlar va kaloriya: ilova oxirgi marta yuborgan holat
        long hd = fresh ? sp.getLong("habDone", 0) : 0, ht = sp.getLong("habTotal", 0);
        v.setTextViewText(R.id.w_hab_val, ht > 0 ? hd + " / " + ht : "—");
        v.setProgressBar(R.id.w_hab_bar, 100, pct(hd, ht), false);
        long ki = fresh ? sp.getLong("kcalIn", 0) : 0, kt = sp.getLong("kcalTgt", 0);
        v.setTextViewText(R.id.w_kcal_val, n(ki));
        v.setProgressBar(R.id.w_kcal_bar, 100, pct(ki, kt), false);

        // Sarf: tinch holat (kun o'tgan sari) + qadamlar + bugungi mashqlar
        long out = -1;
        float baseM = sp.getFloat("baseMeasured", 0f), baseF = sp.getFloat("baseFactor", 0f), perStep = sp.getFloat("perStep", 0f);
        if (baseM > 0f) {
            Calendar mid = Calendar.getInstance();
            mid.set(Calendar.HOUR_OF_DAY, 0); mid.set(Calendar.MINUTE, 0); mid.set(Calendar.SECOND, 0); mid.set(Calendar.MILLISECOND, 0);
            float frac = Math.min(1f, (System.currentTimeMillis() - mid.getTimeInMillis()) / 86400000f);
            float base = steps > 0 ? baseM : baseF;
            out = Math.round(base * frac + steps * perStep + (fresh ? sp.getFloat("exKcal", 0f) : 0f));
            v.setTextViewText(R.id.w_out_val, n(out));
            v.setProgressBar(R.id.w_out_bar, 100, pct(out, kt > 0 ? kt : Math.round(base)), false);
        } else {
            v.setTextViewText(R.id.w_out_val, "—");
            v.setProgressBar(R.id.w_out_bar, 100, 0, false);
        }
        String note;
        if (!fresh) note = "Bugungi odatlar uchun ilovani oching";
        else if (StepStore.inVehicle(c)) note = "Hozir transportda — qadamlar ayirilmoqda";
        else if (out >= 0) { long bal = ki - out; note = "Balans: " + (bal > 0 ? "+" : "−") + n(Math.abs(bal)) + " kkal"; }
        else note = "Kaloriya uchun ilovada profilni to'ldiring";
        v.setTextViewText(R.id.w_note, note);

        Intent open = new Intent(c, MainActivity.class).setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        PendingIntent pi = PendingIntent.getActivity(c, 0, open, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        v.setOnClickPendingIntent(R.id.w_root, pi);
        return v;
    }
}
