import React from 'react';
import { useLocation } from 'react-router-dom';
import { useBreadcrumb } from '../hooks/appNavigation';
import { pizzaService } from '../service/service';
import View from './view';
import Button from '../components/button';
import { User } from '../service/pizzaService';

export default function DeleteUser() {
    const state = useLocation().state as { user?: User } | null;
    const navigateToParent = useBreadcrumb();
    const user = state?.user;

    async function remove() {
        if (!user?.id) {
            navigateToParent();
            return;
        }
        await pizzaService.deleteUser(user.id);
        navigateToParent();
    }

    return (
        <View title="Manage user">
            <div className="text-start py-8 px-4 sm:px-6 lg:px-8">
                <div className="text-neutral-100">
                    Are you sure you want to delete user{' '}
                    <span className="text-orange-500">{user?.name || 'Unknown user'}</span>{' '}
                    <span className="text-orange-500">({user?.email || 'No email'})</span>? This
                    cannot be restored.
                </div>
                <Button title="Delete" onPress={remove} />
                <Button
                    title="Cancel"
                    onPress={navigateToParent}
                    className="bg-transparent border-neutral-300"
                />
            </div>
        </View>
    );
}
