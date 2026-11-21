package uz.diyor.odatlar;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;

/** Telefon qayta yoqilganda transportni aniqlashni qayta ulaydi. */
public class StepBootReceiver extends BroadcastReceiver {
    @Override
    public void onReceive(Context context, Intent intent) {
        final Context c = context.getApplicationContext();
        if (!c.getSharedPreferences("odat_steps", Context.MODE_PRIVATE).getBoolean("enabled", false)) return;
        StepStore.setVehicle(c, false);
        StepSetup.setup(c);
        final PendingResult pr = goAsync();
        new Thread(() -> { try { StepReader.readAndRecord(c, 4000); } finally { pr.finish(); } }).start();
    }
}
