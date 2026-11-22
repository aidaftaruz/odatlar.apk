package uz.diyor.odatlar;

import android.content.Context;
import android.os.Build;
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

    @PluginMethod
    public void getDays(PluginCall call) {
        final Context c = getContext().getApplicationContext();
        new Thread(() -> {
            Float v = StepReader.read(c, 2500);
            if (v != null) StepStore.record(c, v);
            JSObject r = new JSObject();
            try { r.put("days", new JSObject(StepStore.daysJson(c))); } catch (Exception e) { r.put("days", new JSObject()); }
            r.put("vehicle", StepStore.inVehicle(c));
            r.put("live", v != null);
            call.resolve(r);
        }).start();
    }
}
