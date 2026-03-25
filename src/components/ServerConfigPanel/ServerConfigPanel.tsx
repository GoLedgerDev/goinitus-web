import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import Drawer from '@mui/material/Drawer';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import Toolbar from '@mui/material/Toolbar';
import { useConfigStore } from '@/store/configStore';
import { useGlobalStore } from '@/store/globalStore';

const schema = z.object({
  serverUrl: z
    .string()
    .min(1, 'Server URL is required')
    .regex(/^https?:\/\//, 'Must start with http:// or https://'),
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
});
type FormValues = z.infer<typeof schema>;

interface ServerConfigPanelProps {
  open: boolean;
  onClose: () => void;
}

export function ServerConfigPanel({ open, onClose }: ServerConfigPanelProps) {
  const currentUrl = useConfigStore((s) => s.serverUrl);
  const setServerUrl = useConfigStore((s) => s.setServerUrl);
  const setAuthToken = useConfigStore((s) => s.setAuthToken);
  const retry = useGlobalStore((s) => s.retry);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isValid },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: 'onChange',
    defaultValues: {
      serverUrl: currentUrl,
      username: '',
      password: '',
    },
  });

  const onSubmit = async (data: FormValues) => {
    // Stage: update store (in-memory) but only localStorage is written on success via store
    setServerUrl(data.serverUrl);
    setAuthToken(data.username, data.password);
    onClose();
    await retry();
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      sx={{ '& .MuiDrawer-paper': { width: 360 } }}
    >
      <Toolbar
        sx={{ display: 'flex', justifyContent: 'space-between', pr: 1 }}
      >
        <Typography variant="h6">Server Configuration</Typography>
        <IconButton onClick={onClose} aria-label="close settings panel">
          <CloseIcon />
        </IconButton>
      </Toolbar>
      <Divider />

      <Box
        component="form"
        onSubmit={handleSubmit(onSubmit)}
        noValidate
        sx={{ p: 3 }}
      >
        <Stack spacing={3}>
          <TextField
            label="Server URL"
            placeholder="http://localhost:80"
            fullWidth
            error={Boolean(errors.serverUrl)}
            helperText={errors.serverUrl?.message}
            inputProps={{ 'aria-label': 'Server URL' }}
            {...register('serverUrl')}
          />

          <Typography variant="subtitle2" color="text.secondary">
            Credentials
          </Typography>

          <TextField
            label="Username"
            autoComplete="username"
            fullWidth
            error={Boolean(errors.username)}
            helperText={errors.username?.message}
            inputProps={{ 'aria-label': 'Username' }}
            {...register('username')}
          />

          <TextField
            label="Password"
            type="password"
            autoComplete="current-password"
            fullWidth
            error={Boolean(errors.password)}
            helperText={errors.password?.message}
            inputProps={{ 'aria-label': 'Password' }}
            {...register('password')}
          />

          <Button
            type="submit"
            variant="contained"
            fullWidth
            disabled={!isValid || isSubmitting}
          >
            {isSubmitting ? 'Connecting…' : 'Connect'}
          </Button>
        </Stack>
      </Box>
    </Drawer>
  );
}
