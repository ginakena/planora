import {
  Card, CardContent, Typography, Box, Avatar, Chip, Tooltip, IconButton,
} from '@mui/material';
import DeleteIcon from "@mui/icons-material/Delete";
import CommentOutlinedIcon from '@mui/icons-material/CommentOutlined';
import FlagIcon from '@mui/icons-material/Flag';
import { format } from 'date-fns';

const PRIORITY_COLOR = { low: 'success', medium: 'warning', high: 'error' };

const TaskCard = ({ task, onClick, onDelete, commentCount = 0 }) => {
  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'done';

  return (
    <Card
      elevation={0}
      onClick={onClick}
      sx={{
        mb: 1.5,
        borderRadius: 2,
        border: '1px solid',
        borderColor: 'divider',
        cursor: 'pointer',
        transition: 'box-shadow 0.15s, transform 0.15s',
        '&:hover': { boxShadow: 3, transform: 'translateY(-1px)' },
      }}
    >
      <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
        {/* Priority flag + title */}
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.5, mb: 0.5 }}>
          <Tooltip title={`${task.priority} priority`}>
            <FlagIcon sx={{ fontSize: 14, color: `${PRIORITY_COLOR[task.priority]}.main`, mt: 0.3, flexShrink: 0 }} />
          </Tooltip>
          <Typography variant="body2" fontWeight={600} sx={{ lineHeight: 1.4, flex: 1 }}>
            {task.title}
          </Typography>
          <IconButton
            size="small"
            onClick={(e) => { e.stopPropagation(); onDelete?.(task._id); }}
            sx={{ p: 0.3, opacity: 0, '.MuiCard-root:hover &': { opacity: 1 }, color: 'error.main' }}
          >
            <DeleteIcon sx={{ fontSize: 15 }} />
          </IconButton>
        </Box>

        {task.description && (
          <Typography variant="caption" color="text.secondary" sx={{
            display: '-webkit-box', WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical', overflow: 'hidden', mb: 1,
          }}>
            {task.description}
          </Typography>
        )}

        {/* Footer: assignee, due date, comment count */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', mt: 0.5 }}>
          {task.assignee && (
            <Tooltip title={task.assignee.username}>
              <Avatar src={task.assignee.avatar} sx={{ width: 20, height: 20, fontSize: 10, bgcolor: 'secondary.main' }}>
                {task.assignee.username?.[0]?.toUpperCase()}
              </Avatar>
            </Tooltip>
          )}

          {task.dueDate && (
            <Chip
              label={format(new Date(task.dueDate), 'MMM d')}
              size="small"
              color={isOverdue ? 'error' : 'default'}
              variant={isOverdue ? 'filled' : 'outlined'}
              sx={{ fontSize: 10, height: 18, px: 0.5 }}
            />
          )}

          {commentCount > 0 && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.3, ml: 'auto' }}>
              <CommentOutlinedIcon sx={{ fontSize: 12, color: 'text.secondary' }} />
              <Typography variant="caption" color="text.secondary">{commentCount}</Typography>
            </Box>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

export default TaskCard;