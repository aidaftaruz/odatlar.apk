package uz.diyor.odatlar;

import android.content.Context;
import android.content.SharedPreferences;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Date;
import java.util.Iterator;
import java.util.List;
import java.util.Locale;
import org.json.JSONException;
import org.json.JSONObject;

/** Qadam sensori ko'rsatkichlaridan kunlik yurish va transportdagi qadamlarni yig'adi. */
public class StepStore {
    private static final String P = "odat_steps";
    static final long MAX_VEHICLE_MS = 2L * 60 * 60 * 1000; // transport holati ko'pi bilan 2 soat

    static String day(long t) {
        return new SimpleDateFormat("yyyy-MM-dd", Locale.US).format(new Date(t));
    }

    /** Sensor qiymatini yozadi: oldingi o'qishdan beri qo'shilgan qadamlar bugungi kunga qo'shiladi. */
    static synchronized void record(Context c, float value) {
        SharedPreferences sp = c.getSharedPreferences(P, Context.MODE_PRIVATE);
        try {
            JSONObject days = new JSONObject(sp.getString("days", "{}"));
            float last = sp.getFloat("last", -1f);
            boolean veh = sp.getBoolean("veh", false);
            if (veh && System.currentTimeMillis() - sp.getLong("vehSince", 0) > MAX_VEHICLE_MS) {
                veh = false; // tushish signali kelmay qolgan bo'lsa, holat o'zi tugaydi
                sp.edit().putBoolean("veh", false).apply();
            }
            if (last >= 0f) {
                float d = value - last;
                if (d < 0f) d = value; // telefon qayta yoqilgan: hisoblagich noldan boshlangan
                if (d > 0f && d < 60000f) {
                    String today = day(System.currentTimeMillis());
                    JSONObject o = days.optJSONObject(today);
                    if (o == null) { o = new JSONObject(); days.put(today, o); }
                    String k = veh ? "vehicle" : "walk";
                    o.put(k, o.optLong(k, 0) + Math.round(d));
                }
            }
            // 150 kundan eskisini o'chirish
            List<String> keys = new ArrayList<>();
            Iterator<String> it = days.keys();
            while (it.hasNext()) keys.add(it.next());
            Collections.sort(keys);
            while (keys.size() > 150) days.remove(keys.remove(0));
            sp.edit().putFloat("last", value).putLong("lastT", System.currentTimeMillis())
                .putString("days", days.toString()).apply();
        } catch (JSONException ignored) {}
    }

    static synchronized void setVehicle(Context c, boolean v) {
        SharedPreferences.Editor e = c.getSharedPreferences(P, Context.MODE_PRIVATE).edit().putBoolean("veh", v);
        if (v) e.putLong("vehSince", System.currentTimeMillis());
        e.apply();
    }

    static boolean inVehicle(Context c) {
        SharedPreferences sp = c.getSharedPreferences(P, Context.MODE_PRIVATE);
        return sp.getBoolean("veh", false) && System.currentTimeMillis() - sp.getLong("vehSince", 0) <= MAX_VEHICLE_MS;
    }

    /** Berilgan kundagi "transport" qadamlarini yurishga qaytaradi. */
    static synchronized void reclaim(Context c, String date) {
        SharedPreferences sp = c.getSharedPreferences(P, Context.MODE_PRIVATE);
        try {
            JSONObject days = new JSONObject(sp.getString("days", "{}"));
            JSONObject o = days.optJSONObject(date);
            if (o == null) return;
            o.put("walk", o.optLong("walk", 0) + o.optLong("vehicle", 0));
            o.put("vehicle", 0);
            sp.edit().putString("days", days.toString()).apply();
        } catch (JSONException ignored) {}
    }

    static String daysJson(Context c) {
        return c.getSharedPreferences(P, Context.MODE_PRIVATE).getString("days", "{}");
    }
}
