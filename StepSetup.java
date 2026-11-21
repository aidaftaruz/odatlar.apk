package uz.diyor.odatlar;

import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import androidx.work.ExistingPeriodicWorkPolicy;
import androidx.work.PeriodicWorkRequest;
import androidx.work.WorkManager;
import com.google.android.gms.location.ActivityRecognition;
import com.google.android.gms.location.ActivityTransition;
import com.google.android.gms.location.ActivityTransitionRequest;
import com.google.android.gms.location.DetectedActivity;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.TimeUnit;

/** Fondagi o'qishni va transportni aniqlashni yoqadi. */
public class StepSetup {
    static void setup(Context c) {
        try {
            PeriodicWorkRequest req = new PeriodicWorkRequest.Builder(StepWorker.class, 15, TimeUnit.MINUTES).build();
            WorkManager.getInstance(c).enqueueUniquePeriodicWork("odat-steps", ExistingPeriodicWorkPolicy.KEEP, req);
        } catch (Exception ignored) {}
        try {
            List<ActivityTransition> t = new ArrayList<>();
            t.add(new ActivityTransition.Builder().setActivityType(DetectedActivity.IN_VEHICLE)
                .setActivityTransition(ActivityTransition.ACTIVITY_TRANSITION_ENTER).build());
            t.add(new ActivityTransition.Builder().setActivityType(DetectedActivity.IN_VEHICLE)
                .setActivityTransition(ActivityTransition.ACTIVITY_TRANSITION_EXIT).build());
            int flags = PendingIntent.FLAG_UPDATE_CURRENT | (Build.VERSION.SDK_INT >= 31 ? PendingIntent.FLAG_MUTABLE : 0);
            PendingIntent pi = PendingIntent.getBroadcast(c, 7301, new Intent(c, TransitionReceiver.class), flags);
            ActivityRecognition.getClient(c).requestActivityTransitionUpdates(new ActivityTransitionRequest(t), pi);
        } catch (SecurityException ignored) {
        } catch (Exception ignored) {}
    }
}
