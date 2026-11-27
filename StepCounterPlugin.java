package uz.diyor.odatlar;

import android.content.Context;
import android.os.Build;
import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.PermissionState;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;

@CapacitorPlugin(
    name = "StepCounter",
    permissions = { @Permission(alias = "activity", strings = { "android.permission.ACTIVITY_RECOGNITION" }) }
)
public class StepCounterPlugin extends Plugin {

    private boolean granted() {
        return Build.VERSION.SDK_INT < 29 || getPermissionState("activity") == PermissionState.GRANTED;
    }

    private JSObject state() {
        JSObject r = new JSObject();
        r.put("available", StepReader.available(getContext()));
        r.put("granted", granted());
        return r;
    }

    @PluginMethod
    public void status(PluginCall call) { call.resolve(state()); }

    @PluginMethod
    public void requestPermission(PluginCall call) {
        if (granted()) { call.resolve(state()); return; }
        requestPermissionForAlias("activity", call, "permCallback");
    }

    @PermissionCallback
    private void permCallback(PluginCall call) { call.resolve(state()); }

    @PluginMethod
    public void start(PluginCall call) {
        if (!granted()) { call.reject("Jismoniy faollik ruxsati berilmagan"); return; }
        final Context c = getContext().getApplicationContext();
        c.getSharedPreferences("odat_steps", Context.MODE_PRIVATE).edit().putBoolean("enabled", true).apply();
        StepSetup.setup(c);
        new Thread(() -> { StepReader.readAndRecord(c, 3000); call.resolve(state()); }).start();
    }

    @PluginMethod
    public void setVehicle(PluginCall call) {
        final Context c = getContext().getApplicationContext();
        final boolean on = call.getBoolean("on", false);
        new Thread(() -> { StepReader.readAndRecord(c, 2500); StepStore.setVehicle(c, on); call.resolve(state()); }).start();
    }

    @PluginMethod
    public void reclaim(PluginCall call) {
        final Context c = getContext().getApplicationContext();
        final String date = call.getString("date", StepStore.day(System.currentTimeMillis()));
        new Thread(() -> {
            StepReader.readAndRecord(c, 2500);
            StepStore.reclaim(c, date);
            if (date.equals(StepStore.day(System.currentTimeMillis()))) StepStore.setVehicle(c, false);
            call.resolve(state());
        }).start();
    }

    /** Ilova bugungi holatni vidjetga yuboradi. */
    @PluginMethod
    public void updateWidget(PluginCall call) {
        final Context c = getContext().getApplicationContext();
        String today = StepStore.day(System.currentTimeMillis());
        c.getSharedPreferences(OdatWidget.P, Context.MODE_PRIVATE).edit()
            .putString("date", today)
            .putLong("steps", call.getInt("steps", 0))
            .putLong("stepGoal", call.getInt("stepGoal", 10000))
            .putLong("walkAt", StepStore.walkOn(c, today))
            .putLong("habDone", call.getInt("habDone", 0))
            .putLong("habTotal", call.getInt("habTotal", 0))
            .putLong("kcalIn", call.getInt("kcalIn", 0))
            .putLong("kcalTgt", call.getInt("kcalTgt", 0))
            .putFloat("baseMeasured", call.getFloat("baseMeasured", 0f))
            .putFloat("baseFactor", call.getFloat("baseFactor", 0f))
            .putFloat("perStep", call.getFloat("perStep", 0f))
            .putFloat("exKcal", call.getFloat("exKcal", 0f))
            .apply();
        OdatWidget.refreshAll(c);
        call.resolve();
    }

    @PluginMethod
    public void getDays(PluginCall call) {
        final Context c = getContext().getApplicationContext();
        new Thread(() -> {
            Float v = StepReader.read(c, 2500);
            if (v != null) StepStore.record(c, v);
            JSObject r = new JSObject();
            try { r.put("days", new JSObject(StepStore.daysJson(c))); } catch (Exception e) { r.put("days", new JSObject()); }
            r.put("vehicle", StepStore.inVehicle(c));
            try { r.put("sessions", new JSArray(StepStore.sessionsJson(c))); } catch (Exception e) { r.put("sessions", new JSArray()); }
            r.put("live", v != null);
            call.resolve(r);
        }).start();
    }
}
