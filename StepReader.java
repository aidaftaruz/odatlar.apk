package uz.diyor.odatlar;

import android.content.Context;
import android.hardware.Sensor;
import android.hardware.SensorEvent;
import android.hardware.SensorEventListener;
import android.hardware.SensorManager;
import android.os.Handler;
import android.os.HandlerThread;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;

/** Telefonning apparat qadam hisoblagichidan joriy qiymatni o'qiydi (asosiy oqimda chaqirmang). */
public class StepReader {
    static boolean available(Context c) {
        SensorManager sm = (SensorManager) c.getSystemService(Context.SENSOR_SERVICE);
        return sm != null && sm.getDefaultSensor(Sensor.TYPE_STEP_COUNTER) != null;
    }

    static Float read(Context c, long timeoutMs) {
        SensorManager sm = (SensorManager) c.getSystemService(Context.SENSOR_SERVICE);
        if (sm == null) return null;
        Sensor s = sm.getDefaultSensor(Sensor.TYPE_STEP_COUNTER);
        if (s == null) return null;
        final float[] v = {-1f};
        final CountDownLatch latch = new CountDownLatch(1);
        HandlerThread ht = new HandlerThread("odat-steps");
        ht.start();
        SensorEventListener li = new SensorEventListener() {
            @Override public void onSensorChanged(SensorEvent e) { v[0] = e.values[0]; latch.countDown(); }
            @Override public void onAccuracyChanged(Sensor sensor, int accuracy) {}
        };
        try {
            sm.registerListener(li, s, SensorManager.SENSOR_DELAY_NORMAL, new Handler(ht.getLooper()));
            latch.await(timeoutMs, TimeUnit.MILLISECONDS);
        } catch (Exception ignored) {
        } finally {
            sm.unregisterListener(li);
            ht.quitSafely();
        }
        return v[0] >= 0f ? v[0] : null;
    }

    static void readAndRecord(Context c, long timeoutMs) {
        Float v = read(c, timeoutMs);
        if (v != null) StepStore.record(c, v);
    }
}
